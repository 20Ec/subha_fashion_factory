-- ============================================================
--  Subha Fashion Factory — Supabase schema
--  Run this once in the Supabase SQL editor (fresh project).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pricing_type as enum ('inch', 'pieces', 'size');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_type as enum ('return', 'replace', 'cancel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected', 'completed');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create unique index profiles_email_idx on public.profiles (lower(email));
create unique index profiles_single_admin_idx on public.profiles ((role)) where role = 'admin';

-- ---------- CATALOG ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  image_public_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  cover_image text,
  min_price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_active_idx on public.products (is_active, created_at desc);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  public_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  pricing_type public.pricing_type not null,
  label text not null,
  price numeric(10, 2) not null check (price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, pricing_type, label)
);
create index product_options_product_idx on public.product_options (product_id, sort_order);

-- ---------- ADDRESSES ----------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text not null default '',
  city text not null,
  state text not null,
  pincode text not null,
  landmark text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

-- ---------- CART ----------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  option_id uuid not null references public.product_options(id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (cart_id, option_id)
);
create index cart_items_cart_idx on public.cart_items (cart_id);

-- ---------- ORDERS ----------
create sequence if not exists public.order_number_seq start with 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('SFF-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  address_snapshot jsonb not null default '{}'::jsonb,
  subtotal numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  confirmed_total numeric(10, 2),
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  customer_note text,
  admin_note text,
  cancellation_reason text,
  courier text,
  tracking_number text,
  tracking_url text,
  placed_at timestamptz not null default now(),
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, placed_at desc);
create index orders_status_idx on public.orders (status, placed_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  image_url text,
  pricing_type public.pricing_type,
  option_label text not null default '',
  unit_price numeric(10, 2) not null default 0,
  quantity integer not null default 1,
  line_total numeric(10, 2) not null default 0
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_history_order_idx on public.order_status_history (order_id, created_at);

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  type public.request_type not null,
  reason text not null default '',
  description text not null default '',
  status public.request_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index order_requests_order_idx on public.order_requests (order_id, status);
create index order_requests_user_idx on public.order_requests (user_id, created_at desc);

-- Only one return/replacement may ever be active or completed per order, and
-- return/replacement are mutually exclusive.
create unique index order_requests_single_return_replace_idx
  on public.order_requests (order_id)
  where type in ('return', 'replace') and status in ('pending', 'approved', 'completed');

-- Only one cancellation request may be pending at a time.
create unique index order_requests_single_pending_cancel_idx
  on public.order_requests (order_id)
  where type = 'cancel' and status = 'pending';

-- ============================================================
--  FUNCTIONS & TRIGGERS
-- ============================================================

-- Admin check used by RLS (security definer avoids recursive policy checks)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent privilege escalation: only SQL editor / service role can change roles
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'You are not allowed to change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists carts_updated_at on public.carts;
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

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

-- Max 5 saved addresses per customer
create or replace function public.enforce_address_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  address_count integer;
begin
  select count(*) into address_count
  from public.addresses
  where user_id = new.user_id;

  if address_count >= 5 then
    raise exception 'You can save a maximum of 5 delivery addresses';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_address_limit_trigger on public.addresses;
create trigger enforce_address_limit_trigger
  before insert on public.addresses
  for each row execute function public.enforce_address_limit();

-- Keep a single default address per customer
create or replace function public.handle_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.addresses where user_id = new.user_id and id <> new.id) = 0 then
    new.is_default := true;
  elsif new.is_default then
    update public.addresses
      set is_default = false
      where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

drop trigger if exists handle_default_address_trigger on public.addresses;
create trigger handle_default_address_trigger
  before insert or update of is_default on public.addresses
  for each row execute function public.handle_default_address();

-- Keep products.min_price in sync with the cheapest active option
create or replace function public.refresh_product_min_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set min_price = coalesce((
    select min(o.price) from public.product_options o
    where o.product_id = v_product_id and o.is_active
  ), 0)
  where p.id = v_product_id;
  return null;
end;
$$;

drop trigger if exists product_options_min_price on public.product_options;
create trigger product_options_min_price
  after insert or update of price, is_active or delete on public.product_options
  for each row execute function public.refresh_product_min_price();

-- Atomically place an order from the customer's saved cart
create or replace function public.place_order(
  p_address_id uuid,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cart_id uuid;
  v_address public.addresses;
  v_subtotal numeric(10, 2) := 0;
  v_order_id uuid;
begin
  if v_user is null then
    raise exception 'You must be signed in to place an order';
  end if;

  select * into v_address
  from public.addresses
  where id = p_address_id and user_id = v_user;

  if not found then
    raise exception 'Please choose a valid delivery address';
  end if;

  select id into v_cart_id from public.carts where user_id = v_user;

  if v_cart_id is null or not exists (
    select 1 from public.cart_items where cart_id = v_cart_id
  ) then
    raise exception 'Your cart is empty';
  end if;

  if exists (
    select 1
    from public.cart_items ci
    left join public.product_options o on o.id = ci.option_id and o.is_active
    left join public.products p on p.id = ci.product_id and p.is_active
    where ci.cart_id = v_cart_id and (o.id is null or p.id is null)
  ) then
    raise exception 'Some items in your cart are no longer available';
  end if;

  select coalesce(sum(o.price * ci.quantity), 0)
  into v_subtotal
  from public.cart_items ci
  join public.product_options o on o.id = ci.option_id
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone,
    address_snapshot, subtotal, total, customer_note
  )
  values (
    v_user,
    (select full_name from public.profiles where id = v_user),
    (select email from public.profiles where id = v_user),
    v_address.phone,
    to_jsonb(v_address) - 'id' - 'user_id',
    v_subtotal,
    v_subtotal,
    nullif(btrim(p_note), '')
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, product_name, product_slug, image_url,
    pricing_type, option_label, unit_price, quantity, line_total
  )
  select
    v_order_id, p.id, p.name, p.slug, p.cover_image,
    o.pricing_type, o.label, o.price, ci.quantity, o.price * ci.quantity
  from public.cart_items ci
  join public.product_options o on o.id = ci.option_id
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id;

  insert into public.order_status_history (order_id, status, note, created_by)
  values (v_order_id, 'pending', 'Order placed', v_user);

  delete from public.cart_items where cart_id = v_cart_id;

  return v_order_id;
end;
$$;

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

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_requests enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- categories
create policy "categories_public_read" on public.categories
  for select using (is_active or public.is_admin());
create policy "categories_admin_insert" on public.categories
  for insert with check (public.is_admin());
create policy "categories_admin_update" on public.categories
  for update using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_delete" on public.categories
  for delete using (public.is_admin());

-- products
create policy "products_public_read" on public.products
  for select using (is_active or public.is_admin());
create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

-- product images
create policy "product_images_public_read" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.is_active
    )
  );
create policy "product_images_admin_insert" on public.product_images
  for insert with check (public.is_admin());
create policy "product_images_admin_update" on public.product_images
  for update using (public.is_admin()) with check (public.is_admin());
create policy "product_images_admin_delete" on public.product_images
  for delete using (public.is_admin());

-- product options
create policy "product_options_public_read" on public.product_options
  for select using (
    public.is_admin() or (
      is_active and exists (
        select 1 from public.products p where p.id = product_id and p.is_active
      )
    )
  );
create policy "product_options_admin_insert" on public.product_options
  for insert with check (public.is_admin());
create policy "product_options_admin_update" on public.product_options
  for update using (public.is_admin()) with check (public.is_admin());
create policy "product_options_admin_delete" on public.product_options
  for delete using (public.is_admin());

-- addresses
create policy "addresses_select_own" on public.addresses
  for select using (user_id = auth.uid());
create policy "addresses_insert_own" on public.addresses
  for insert with check (user_id = auth.uid());
create policy "addresses_update_own" on public.addresses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses_delete_own" on public.addresses
  for delete using (user_id = auth.uid());

-- cart
create policy "carts_select_own" on public.carts
  for select using (user_id = auth.uid());
create policy "carts_insert_own" on public.carts
  for insert with check (user_id = auth.uid());
create policy "carts_update_own" on public.carts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "carts_delete_own" on public.carts
  for delete using (user_id = auth.uid());

create policy "cart_items_all_own" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- orders (customers read only their own; admin reads/updates all)
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order items
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- order status history
create policy "order_history_select_own_or_admin" on public.order_status_history
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );
create policy "order_history_admin_insert" on public.order_status_history
  for insert with check (public.is_admin());

-- requests
create policy "order_requests_select_own_or_admin" on public.order_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy "order_requests_admin_update" on public.order_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  ADMIN PROMOTION (run manually, after registering the admin
--  account through the website). Only ONE admin is allowed.
-- ============================================================
-- update public.profiles
--   set role = 'admin'
--   where email = 'admin@example.com';
