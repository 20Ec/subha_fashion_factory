-- ============================================================================
--  SUBHA FASHION FACTORY — ONE-TIME CATALOG IMPORT
-- ============================================================================
--  Run this ONCE in the Supabase SQL Editor, AFTER supabase/schema.sql.
--
--  It creates the real catalog from the printed price list:
--    • 5 categories
--    • 33 products
--    • every Inch / Pieces / Size price option
--
--  The script is idempotent: running it again updates the same rows instead
--  of creating duplicates. Prices and option labels are reset to the values
--  below on every run.
--
--  Product photos are NOT included here. Add them from
--  Admin → Products → Edit product → Images after the import.
-- ============================================================================

do $$
begin
  if to_regclass('public.products') is null then
    raise exception
      'public.products is missing. Run supabase/schema.sql before this import.';
  end if;
end
$$;

begin;

-- ----------------------------------------------------------------------------
-- 1. Categories
-- ----------------------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order, is_active)
values
  (
    'Saree Flowers',
    'saree-flowers',
    'Traditional handcrafted jasmine strings and floral arrangements for saree and festive hair styling.',
    1,
    true
  ),
  (
    'Small Flowers',
    'small-flowers',
    'Handcrafted single flower accents and small floral pieces.',
    2,
    true
  ),
  (
    'Hair Accessories',
    'hair-accessories',
    'Handcrafted clips, kamps and hair bands for everyday and festive styling.',
    3,
    true
  ),
  (
    'Kids Wear',
    'kids-wear',
    'Handcrafted floral hair accessories sized for kids.',
    4,
    true
  ),
  (
    'Jewellery',
    'jewellery',
    'Handcrafted temple-inspired pendants and jhumkas.',
    5,
    true
  )
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- ----------------------------------------------------------------------------
-- 2. Staging data: one row per catalog item, prices stored as JSON
-- ----------------------------------------------------------------------------
create temp table _catalog_import (
  catalog_number integer primary key,
  name text not null,
  slug text not null unique,
  category_slug text not null,
  description text not null,
  is_featured boolean not null default false,
  pricing jsonb not null
) on commit drop;

insert into _catalog_import
  (catalog_number, name, slug, category_slug, description, is_featured, pricing)
values
  (
    1,
    'Madras Malli',
    'madras-malli',
    'saree-flowers',
    'Handcrafted jasmine-style malli in the classic Madras pattern, finished as a long floral string for saree and hair styling. Available in 16 inch and 8 inch lengths.',
    true,
    '[{"pricing_type":"inch","label":"16 inch","price":900},{"pricing_type":"inch","label":"8 inch","price":450}]'::jsonb
  ),
  (
    2,
    'Mullai',
    'mullai',
    'saree-flowers',
    'Delicate handcrafted mullai jasmine string for saree and hair styling. Available in 16 inch and 8 inch lengths.',
    true,
    '[{"pricing_type":"inch","label":"16 inch","price":1000},{"pricing_type":"inch","label":"8 inch","price":500}]'::jsonb
  ),
  (
    3,
    'Mullai With Red Rose',
    'mullai-with-red-rose',
    'saree-flowers',
    'Handcrafted mullai jasmine string accented with red roses. Available in 16 inch and 8 inch lengths.',
    true,
    '[{"pricing_type":"inch","label":"16 inch","price":1200},{"pricing_type":"inch","label":"8 inch","price":600}]'::jsonb
  ),
  (
    4,
    'Jathi Malli',
    'jathi-malli',
    'saree-flowers',
    'Handcrafted jathi malli string with layered jasmine buds, ideal for festive saree styling. Available in 16 inch and 8 inch lengths.',
    true,
    '[{"pricing_type":"inch","label":"16 inch","price":1300},{"pricing_type":"inch","label":"8 inch","price":650}]'::jsonb
  ),
  (
    5,
    'Lotus With Malli',
    'lotus-with-malli',
    'small-flowers',
    'Handcrafted lotus and malli flower accent for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":250}]'::jsonb
  ),
  (
    6,
    'Lotus 2 Piece Clip',
    'lotus-2-piece-clip',
    'hair-accessories',
    'Handcrafted two-piece lotus clip set for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":200}]'::jsonb
  ),
  (
    7,
    'Off Moon Malli With Lotus',
    'off-moon-malli-with-lotus',
    'small-flowers',
    'Handcrafted off-moon malli and lotus flower accent.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":250}]'::jsonb
  ),
  (
    8,
    'Lotus With Mullai',
    'lotus-with-mullai',
    'small-flowers',
    'Handcrafted lotus and mullai flower accent for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":250}]'::jsonb
  ),
  (
    9,
    'Mullai With Rose',
    'mullai-with-rose',
    'saree-flowers',
    'Handcrafted mullai jasmine string with rose accents. Available in 16 inch and 8 inch lengths.',
    false,
    '[{"pricing_type":"inch","label":"16 inch","price":1200},{"pricing_type":"inch","label":"8 inch","price":600}]'::jsonb
  ),
  (
    10,
    'Pichi Poo Kanagamaram Leaf',
    'pichi-poo-kanagamaram-leaf',
    'saree-flowers',
    'Handcrafted pichi poo flowers with kanagamaram leaves. Available in 16 inch and 8 inch lengths.',
    false,
    '[{"pricing_type":"inch","label":"16 inch","price":1000},{"pricing_type":"inch","label":"8 inch","price":500}]'::jsonb
  ),
  (
    11,
    'Rose With Mullai Flower',
    'rose-with-mullai-flower',
    'small-flowers',
    'Handcrafted rose and mullai flower accent.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":200}]'::jsonb
  ),
  (
    12,
    'Mullai With Off Moon Kamp',
    'mullai-with-off-moon-kamp',
    'hair-accessories',
    'Handcrafted mullai and off-moon floral kamp, available in L, M and XS sizes.',
    false,
    '[{"pricing_type":"size","label":"L","price":350},{"pricing_type":"size","label":"M","price":200},{"pricing_type":"size","label":"XS","price":150}]'::jsonb
  ),
  (
    13,
    'Elephant Jhumka Pearl Beads Hanging',
    'elephant-jhumka-pearl-beads-hanging',
    'jewellery',
    'Handcrafted elephant jhumka with hanging pearl beads.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":500}]'::jsonb
  ),
  (
    14,
    'Kids Wear Alligator Malli Red Rose',
    'kids-wear-alligator-malli-red-rose',
    'kids-wear',
    'Handcrafted malli and red rose alligator clip for kids. Sold as one piece.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":50}]'::jsonb
  ),
  (
    15,
    'Madras Malli, Lotus With Canta Clip',
    'madras-malli-lotus-with-canta-clip',
    'hair-accessories',
    'Handcrafted Madras malli and lotus canta clip for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":250}]'::jsonb
  ),
  (
    16,
    'Jathimalli With Red Rose Medium Size Alligator',
    'jathimalli-with-red-rose-medium-size-alligator',
    'hair-accessories',
    'Handcrafted jathimalli and red rose alligator clip in medium size.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":100}]'::jsonb
  ),
  (
    17,
    'Gundu Malli Real Look Rose Catchclip or Alligator',
    'gundu-malli-real-look-rose-catchclip-or-alligator',
    'hair-accessories',
    'Handcrafted gundu malli with a realistic rose, available as a catch clip or alligator clip.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":250}]'::jsonb
  ),
  (
    18,
    'Kids Wear Alligator Gundu Malli',
    'kids-wear-alligator-gundu-malli',
    'kids-wear',
    'Handcrafted gundu malli alligator clip for kids. Sold as one piece.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":40}]'::jsonb
  ),
  (
    19,
    'Lakshmi Liar Jhumka Pendant',
    'lakshmi-liar-jhumka-pendant',
    'jewellery',
    'Handcrafted Lakshmi jhumka pendant with layered detailing.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":350}]'::jsonb
  ),
  (
    20,
    'Lakshmi Liar Jhumka Pendant',
    'lakshmi-liar-jhumka-pendant-2',
    'jewellery',
    'Handcrafted Lakshmi jhumka pendant, a compact festive accessory.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":40}]'::jsonb
  ),
  (
    21,
    'Jathi Malli Kamp',
    'jathi-malli-kamp',
    'hair-accessories',
    'Handcrafted jathi malli floral kamp for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":250}]'::jsonb
  ),
  (
    22,
    'Madras Malli With Royal Blue Half',
    'madras-malli-with-royal-blue-half',
    'hair-accessories',
    'Handcrafted Madras malli with a royal blue half accent.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":150}]'::jsonb
  ),
  (
    23,
    'Pichboo With Red Rose',
    'pichboo-with-red-rose',
    'saree-flowers',
    'Handcrafted pichboo flowers with red roses. Available in 16 inch and 8 inch lengths.',
    false,
    '[{"pricing_type":"inch","label":"16 inch","price":1000},{"pricing_type":"inch","label":"8 inch","price":500}]'::jsonb
  ),
  (
    24,
    'Sun Kemp',
    'sun-kemp',
    'hair-accessories',
    'Handcrafted sun kemp floral kamp, available in L, M and XS sizes.',
    false,
    '[{"pricing_type":"size","label":"L","price":300},{"pricing_type":"size","label":"M","price":250},{"pricing_type":"size","label":"XS","price":200}]'::jsonb
  ),
  (
    25,
    'Jathi Malli Centre Clip',
    'jathi-malli-centre-clip',
    'hair-accessories',
    'Handcrafted jathi malli centre clip for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":200}]'::jsonb
  ),
  (
    26,
    'Mullai With Red Rose',
    'mullai-with-red-rose-2',
    'small-flowers',
    'Handcrafted mullai jasmine with red rose accent.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":100}]'::jsonb
  ),
  (
    27,
    'Madras Malli With Natural Look',
    'madras-malli-with-natural-look',
    'small-flowers',
    'Handcrafted Madras malli with a natural, realistic finish.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":200}]'::jsonb
  ),
  (
    28,
    'Small Size Kamp Mullai',
    'small-size-kamp-mullai',
    'hair-accessories',
    'Handcrafted small-size mullai kamp for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":150}]'::jsonb
  ),
  (
    29,
    'Small Size Kemp Hair Band',
    'small-size-kemp-hair-band',
    'hair-accessories',
    'Handcrafted small-size kemp floral hair band.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":100}]'::jsonb
  ),
  (
    30,
    'Kamp',
    'kamp',
    'hair-accessories',
    'Handcrafted floral kamp, available in L, M and XS sizes.',
    false,
    '[{"pricing_type":"size","label":"L","price":300},{"pricing_type":"size","label":"M","price":250},{"pricing_type":"size","label":"XS","price":200}]'::jsonb
  ),
  (
    31,
    'Madras Malli Centre Clip',
    'madras-malli-centre-clip',
    'hair-accessories',
    'Handcrafted Madras malli centre clip for hair styling.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":200}]'::jsonb
  ),
  (
    32,
    'Stone Hair Band',
    'stone-hair-band',
    'hair-accessories',
    'Handcrafted stone-accented hair band.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":60}]'::jsonb
  ),
  (
    33,
    'Jadipo Lotus Hair Band',
    'jadipo-lotus-hair-band',
    'hair-accessories',
    'Handcrafted jadipo lotus hair band.',
    false,
    '[{"pricing_type":"pieces","label":"1 piece","price":100}]'::jsonb
  );

-- ----------------------------------------------------------------------------
-- 3. Products
-- ----------------------------------------------------------------------------
insert into public.products (
  name,
  slug,
  description,
  category_id,
  is_active,
  is_featured,
  created_at,
  updated_at
)
select
  d.name,
  d.slug,
  d.description,
  c.id,
  true,
  d.is_featured,
  now() - ((33 - d.catalog_number) * interval '1 minute'),
  now()
from _catalog_import d
join public.categories c on c.slug = d.category_slug
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    is_active = true,
    is_featured = excluded.is_featured,
    updated_at = now();

-- ----------------------------------------------------------------------------
-- 4. Remove options that are no longer part of the catalog definition
-- ----------------------------------------------------------------------------
delete from public.product_options po
using public.products p, _catalog_import d
where po.product_id = p.id
  and p.slug = d.slug
  and not exists (
    select 1
    from jsonb_array_elements(d.pricing) as x(o)
    where (x.o->>'pricing_type')::public.pricing_type = po.pricing_type
      and x.o->>'label' = po.label
  );

-- ----------------------------------------------------------------------------
-- 5. Pricing options (Inch / Pieces / Size)
-- ----------------------------------------------------------------------------
insert into public.product_options (
  product_id,
  pricing_type,
  label,
  price,
  sort_order,
  is_active
)
select
  p.id,
  (t.o->>'pricing_type')::public.pricing_type,
  t.o->>'label',
  (t.o->>'price')::numeric(10, 2),
  (t.ord - 1)::integer,
  true
from _catalog_import d
join public.products p on p.slug = d.slug
cross join lateral jsonb_array_elements(d.pricing) with ordinality as t(o, ord)
on conflict (product_id, pricing_type, label) do update
set price = excluded.price,
    sort_order = excluded.sort_order,
    is_active = true;

commit;

-- ----------------------------------------------------------------------------
-- 6. Verification
-- ----------------------------------------------------------------------------
select
  c.name as category,
  count(p.id) as products,
  min(p.min_price) as cheapest,
  max(p.min_price) as most_expensive
from public.categories c
left join public.products p on p.category_id = c.id
group by c.id, c.name, c.sort_order
order by c.sort_order;

select count(*) as total_products from public.products;
select count(*) as total_options from public.product_options;
