-- ============================================================
--  Subha Fashion Factory — Bill Generator
--  Run after supabase/schema.sql:
--    npm run db:bills
--  (or paste this file into the Supabase SQL Editor)
-- ============================================================

-- Bill numbers are generated from a sequence so two admins can never receive
-- the same number, even when they save at the same moment.
create sequence if not exists public.bill_number_seq start with 1 increment by 1;

-- ---------- TABLES ----------

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  bill_number text not null unique,
  customer_name text not null,
  bill_date date not null default current_date,
  subtotal numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  pdf_path text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bills_customer_name_not_blank check (length(btrim(customer_name)) > 0),
  constraint bills_amounts_non_negative check (
    subtotal >= 0 and shipping >= 0 and total >= 0
  )
);

create table if not exists public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  position integer not null,
  product_name text not null,
  inch text not null default '',
  pieces text not null default '',
  size text not null default '',
  nos numeric(12, 2) not null default 0,
  price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  constraint bill_items_product_name_not_blank check (length(btrim(product_name)) > 0),
  constraint bill_items_amounts_non_negative check (nos >= 0 and price >= 0 and total >= 0),
  constraint bill_items_unique_position unique (bill_id, position)
);

create index if not exists bill_items_bill_id_idx on public.bill_items (bill_id);
create index if not exists bills_created_at_idx on public.bills (created_at desc);
create index if not exists bills_customer_name_idx on public.bills (lower(customer_name));

-- ---------- HELPERS ----------

create or replace function public.set_bill_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bills_set_updated_at on public.bills;
create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_bill_updated_at();

-- ---------- CREATE BILL (atomic) ----------
-- Creates the bill header and every item row in a single transaction.
-- Totals are recalculated here from nos × price — client totals are ignored.
create or replace function public.create_bill(
  p_customer_name text,
  p_bill_date date,
  p_shipping numeric,
  p_items jsonb
)
returns public.bills
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_date date := coalesce(p_bill_date, current_date);
  v_shipping numeric := round(coalesce(p_shipping, 0), 2);
  v_item jsonb;
  v_position integer := 0;
  v_product text;
  v_inch text;
  v_pieces text;
  v_size text;
  v_nos numeric;
  v_price numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_grand_total numeric;
  v_bill_number text;
  v_bill public.bills;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can create bills.' using errcode = '42501';
  end if;

  if v_name = '' then
    raise exception 'Customer name is required.' using errcode = '22023';
  end if;

  if length(v_name) > 120 then
    raise exception 'Customer name is too long.' using errcode = '22023';
  end if;

  if v_shipping < 0 then
    raise exception 'Shipping charges cannot be negative.' using errcode = '22023';
  end if;

  if v_shipping > 9999999999.99 then
    raise exception 'Shipping charges are too large.' using errcode = '22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item to the bill.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'A bill can contain at most 100 items.' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_position := v_position + 1;

    if v_item is null or jsonb_typeof(v_item) <> 'object' then
      raise exception 'Item % is invalid.', v_position using errcode = '22023';
    end if;

    v_product := btrim(coalesce(v_item ->> 'product_name', ''));
    if v_product = '' then
      raise exception 'Item % needs a product name.', v_position using errcode = '22023';
    end if;
    if length(v_product) > 200 then
      raise exception 'Item % product name is too long.', v_position using errcode = '22023';
    end if;

    v_inch := btrim(coalesce(v_item ->> 'inch', ''));
    v_pieces := btrim(coalesce(v_item ->> 'pieces', ''));
    v_size := btrim(coalesce(v_item ->> 'size', ''));

    if length(v_inch) > 40 or length(v_pieces) > 40 or length(v_size) > 40 then
      raise exception 'Item % measurements are too long.', v_position using errcode = '22023';
    end if;

    if coalesce(v_item ->> 'nos', '') !~ '^[0-9]{1,7}(\.[0-9]{1,2})?$' then
      raise exception 'Item % has an invalid Nos value.', v_position using errcode = '22023';
    end if;
    if coalesce(v_item ->> 'price', '') !~ '^[0-9]{1,9}(\.[0-9]{1,2})?$' then
      raise exception 'Item % has an invalid price.', v_position using errcode = '22023';
    end if;

    v_nos := (v_item ->> 'nos')::numeric;
    v_price := (v_item ->> 'price')::numeric;
    v_line_total := round(v_nos * v_price, 2);

    if v_line_total > 9999999999.99 then
      raise exception 'Item % total is too large.', v_position using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + v_line_total;

    if v_subtotal > 9999999999.99 then
      raise exception 'The bill subtotal is too large.' using errcode = '22023';
    end if;
  end loop;

  v_subtotal := round(v_subtotal, 2);
  v_grand_total := round(v_subtotal + v_shipping, 2);

  if v_grand_total > 9999999999.99 then
    raise exception 'The bill total is too large.' using errcode = '22023';
  end if;

  v_bill_number := 'SFF-' || to_char(v_date, 'YYYY') || '-' ||
    lpad(nextval('public.bill_number_seq')::text, 4, '0');

  insert into public.bills (
    bill_number,
    customer_name,
    bill_date,
    subtotal,
    shipping,
    total,
    created_by
  )
  values (
    v_bill_number,
    v_name,
    v_date,
    v_subtotal,
    v_shipping,
    v_grand_total,
    auth.uid()
  )
  returning * into v_bill;

  insert into public.bill_items (
    bill_id,
    position,
    product_name,
    inch,
    pieces,
    size,
    nos,
    price,
    total
  )
  select
    v_bill.id,
    (item.ordinality)::integer,
    btrim(coalesce(item.value ->> 'product_name', '')),
    btrim(coalesce(item.value ->> 'inch', '')),
    btrim(coalesce(item.value ->> 'pieces', '')),
    btrim(coalesce(item.value ->> 'size', '')),
    (item.value ->> 'nos')::numeric(12, 2),
    (item.value ->> 'price')::numeric(12, 2),
    round(
      (item.value ->> 'nos')::numeric(12, 2) * (item.value ->> 'price')::numeric(12, 2),
      2
    )
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality);

  return v_bill;
end;
$$;

revoke all on function public.create_bill(text, date, numeric, jsonb) from public;
revoke all on function public.create_bill(text, date, numeric, jsonb) from anon;
grant execute on function public.create_bill(text, date, numeric, jsonb) to authenticated;

-- ---------- ATTACH PDF ----------
-- Bills are immutable once created; the only post-create write is attaching
-- the generated PDF path.
create or replace function public.attach_bill_pdf(
  p_bill_id uuid,
  p_path text
)
returns public.bills
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := btrim(coalesce(p_path, ''));
  v_bill public.bills;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can update bills.' using errcode = '42501';
  end if;

  if v_path = '' or v_path like '%..%' or v_path !~ '^[A-Za-z0-9._/-]+\.pdf$' then
    raise exception 'Invalid PDF path.' using errcode = '22023';
  end if;

  update public.bills
     set pdf_path = v_path
   where id = p_bill_id
  returning * into v_bill;

  if v_bill.id is null then
    raise exception 'Bill not found.' using errcode = 'P0002';
  end if;

  return v_bill;
end;
$$;

revoke all on function public.attach_bill_pdf(uuid, text) from public;
revoke all on function public.attach_bill_pdf(uuid, text) from anon;
grant execute on function public.attach_bill_pdf(uuid, text) to authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;

-- Reads/deletes are admin-only. Inserts and header updates intentionally have
-- no policy: they only happen through the security-definer functions above.
drop policy if exists "bills_admin_read" on public.bills;
create policy "bills_admin_read" on public.bills
  for select using (public.is_admin());

drop policy if exists "bills_admin_delete" on public.bills;
create policy "bills_admin_delete" on public.bills
  for delete using (public.is_admin());

drop policy if exists "bill_items_admin_read" on public.bill_items;
create policy "bill_items_admin_read" on public.bill_items
  for select using (public.is_admin());

drop policy if exists "bill_items_admin_delete" on public.bill_items;
create policy "bill_items_admin_delete" on public.bill_items
  for delete using (public.is_admin());

-- Supabase grants these automatically for new public tables, but making them
-- explicit keeps direct reads working on every project. RLS still limits all
-- access to admins, and writes only happen through the RPCs above.
grant select, insert, update, delete on table public.bills to authenticated;
grant select, insert, update, delete on table public.bill_items to authenticated;
grant usage, select on sequence public.bill_number_seq to authenticated;
revoke all on table public.bills from anon;
revoke all on table public.bill_items from anon;

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bills',
  'bills',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bills_storage_admin_read" on storage.objects;
create policy "bills_storage_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'bills' and public.is_admin());

drop policy if exists "bills_storage_admin_insert" on storage.objects;
create policy "bills_storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bills' and public.is_admin());

drop policy if exists "bills_storage_admin_update" on storage.objects;
create policy "bills_storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'bills' and public.is_admin())
  with check (bucket_id = 'bills' and public.is_admin());

drop policy if exists "bills_storage_admin_delete" on storage.objects;
create policy "bills_storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bills' and public.is_admin());
