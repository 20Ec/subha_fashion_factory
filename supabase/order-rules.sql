-- ============================================================
--  Subha Fashion Factory — order lifecycle migration
--  Safe to run on an existing database. Mirrors the rules already
--  encoded in src/lib/order-rules.ts.
-- ============================================================

-- Reason supplied by the customer when they cancel an order directly.
alter table public.orders
  add column if not exists cancellation_reason text;

-- Only one return/replacement may ever be active or completed per order, and
-- return/replacement are mutually exclusive.
create unique index if not exists order_requests_single_return_replace_idx
  on public.order_requests (order_id)
  where type in ('return', 'replace') and status in ('pending', 'approved', 'completed');

-- Only one cancellation request may be pending at a time.
create unique index if not exists order_requests_single_pending_cancel_idx
  on public.order_requests (order_id)
  where type = 'cancel' and status = 'pending';

-- Enforce order status/payment rules and freeze cancelled orders. This mirrors
-- the application rules so direct API/database updates cannot break them.
create or replace function public.enforce_order_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status in ('confirmed', 'cancelled')) or
      (old.status = 'confirmed' and new.status in ('packed', 'cancelled')) or
      (old.status = 'packed' and new.status in ('shipped', 'cancelled')) or
      (old.status = 'shipped' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception 'Order status cannot change from % to %', old.status, new.status;
    end if;
  end if;

  if new.payment_status is distinct from old.payment_status then
    if not (
      (old.payment_status = 'pending' and new.payment_status = 'paid') or
      (old.payment_status = 'paid' and new.payment_status = 'refunded')
    ) then
      raise exception 'Payment status cannot change from % to %', old.payment_status, new.payment_status;
    end if;
  end if;

  if old.status = 'cancelled' then
    if new.status is distinct from 'cancelled' then
      raise exception 'A cancelled order cannot be reopened';
    end if;

    if old.payment_status = 'paid' then
      if new.payment_status not in ('paid', 'refunded') then
        raise exception 'A cancelled order can only be marked as refunded';
      end if;
    elsif old.payment_status = 'refunded' then
      if new.payment_status is distinct from 'refunded' then
        raise exception 'A refunded order cannot be changed';
      end if;
    elsif new.payment_status is distinct from 'pending' then
      raise exception 'A cancelled order cannot be marked as paid';
    end if;

    if new.confirmed_total is distinct from old.confirmed_total
       or new.courier is distinct from old.courier
       or new.tracking_number is distinct from old.tracking_number
       or new.tracking_url is distinct from old.tracking_url
       or new.admin_note is distinct from old.admin_note
       or new.cancellation_reason is distinct from old.cancellation_reason
       or new.delivered_at is distinct from old.delivered_at
       or new.customer_name is distinct from old.customer_name
       or new.customer_email is distinct from old.customer_email
       or new.customer_phone is distinct from old.customer_phone
       or new.address_snapshot is distinct from old.address_snapshot
       or new.subtotal is distinct from old.subtotal
       or new.total is distinct from old.total
       or new.customer_note is distinct from old.customer_note
    then
      raise exception 'A cancelled order can no longer be updated';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_rules on public.orders;
create trigger orders_enforce_rules before update on public.orders
  for each row execute function public.enforce_order_rules();

-- Request resolution rules: rejections always need a written reason, and an
-- approved request cannot be re-approved/rejected.
create or replace function public.enforce_request_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if old.status not in ('pending', 'approved') then
      raise exception 'This request has already been resolved';
    end if;

    if old.status = 'pending' and new.status not in ('approved', 'rejected') then
      raise exception 'A pending request can only be approved or rejected';
    end if;

    if old.status = 'approved' and new.status <> 'completed' then
      raise exception 'An approved request can only be marked as completed';
    end if;

  end if;

  if new.status = 'rejected' and coalesce(btrim(new.admin_note), '') = '' then
    raise exception 'A rejection reason is required';
  end if;

  return new;
end;
$$;

drop trigger if exists order_requests_enforce_rules on public.order_requests;
create trigger order_requests_enforce_rules before update on public.order_requests
  for each row execute function public.enforce_request_rules();

-- Customers can freely cancel while the order is still pending. A reason is
-- always required and kept on the order plus its history.
drop function if exists public.cancel_order(uuid);
create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_status public.order_status;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_user is null then
    raise exception 'You must be signed in';
  end if;

  if v_reason = '' then
    raise exception 'Please provide a reason for cancelling';
  end if;

  select status into v_status
  from public.orders
  where id = p_order_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_status <> 'pending' then
    raise exception 'This order can no longer be cancelled directly. Please submit a cancellation request.';
  end if;

  update public.orders
  set status = 'cancelled', cancellation_reason = left(v_reason, 200)
  where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, created_by)
  values (p_order_id, 'cancelled', 'Cancelled by customer — ' || left(v_reason, 200), v_user);
end;
$$;

-- Return / replace / post-confirmation cancellation requests
create or replace function public.request_order_action(
  p_order_id uuid,
  p_type public.request_type,
  p_reason text,
  p_description text default '',
  p_order_item_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders;
  v_request_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_user is null then
    raise exception 'You must be signed in';
  end if;

  if v_reason = '' then
    raise exception 'Please provide a reason for this request';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if p_order_item_id is not null and not exists (
    select 1 from public.order_items
    where id = p_order_item_id and order_id = p_order_id
  ) then
    raise exception 'The selected item does not belong to this order';
  end if;

  if p_type = 'cancel' then
    if v_order.status not in ('confirmed', 'packed', 'shipped') then
      raise exception 'Cancellation can only be requested after the order is confirmed and before delivery';
    end if;

    if exists (
      select 1 from public.order_requests
      where order_id = p_order_id and type = 'cancel' and status = 'pending'
    ) then
      raise exception 'You already have a pending cancellation request for this order';
    end if;
  else
    if v_order.status <> 'delivered' then
      raise exception 'Return or replacement can only be requested after delivery';
    end if;

    if v_order.delivered_at is null or now() > v_order.delivered_at + interval '7 days' then
      raise exception 'The 7-day return/replacement window has closed';
    end if;

    -- Return and replacement are mutually exclusive and only one request may
    -- be active or completed per order.
    if exists (
      select 1 from public.order_requests
      where order_id = p_order_id
        and type in ('return', 'replace')
        and status in ('pending', 'approved', 'completed')
    ) then
      raise exception 'A return or replacement request has already been made for this order';
    end if;
  end if;

  insert into public.order_requests (
    order_id, order_item_id, user_id, type, reason, description
  )
  values (p_order_id, p_order_item_id, v_user, p_type, left(v_reason, 200), coalesce(p_description, ''))
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.place_order(uuid, text) from public, anon;
revoke all on function public.cancel_order(uuid, text) from public, anon;
revoke all on function public.request_order_action(uuid, public.request_type, text, text, uuid) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.request_order_action(uuid, public.request_type, text, text, uuid) to authenticated;
