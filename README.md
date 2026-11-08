# Subha Fashion Factory

A complete, production-ready e-commerce storefront for handmade and artificial flowers, built with Next.js 15 (App Router), Supabase and Cloudinary.

The storefront is customer-facing and mobile-first. A single admin dashboard manages categories, products, orders, cancellations, returns and replacements.

---

## Features

### Storefront
- Elegant floral design — white / light-pink background, blue and soft-pink accents, navy text, Poppins.
- Home page with hero, collections, featured products and craft story.
- Shop page with search, category filter, pricing-type filter, sorting and pagination.
- Product pages with image gallery, description and multi-pricing purchase selector.
- Products can support **Inch**, **Pieces** and **Size** pricing simultaneously, each with its own options and prices.
- Guest cart (`localStorage`) that merges into the account cart after sign-in.
- Cart with quantity controls, item total summary and a clear “confirmed on call” note.
- Checkout with saved delivery addresses, new-address modal and order notes.
- Account page with up to 5 saved addresses.
- My Orders list and full order detail page with status timeline.
- Free cancellation while an order is `pending`.
- Cancellation requests after confirmation, and return / replacement requests within 7 days of delivery.
- No online payment gateway and no stock tracking. Office staff confirm every order by phone.

### Admin
- Single `/login` page for customers and the admin. The role decides where the user lands.
- Admin link in the navbar only for the admin account.
- `/admin/*` is server-gated — non-admins receive a 404.
- Dashboard with order, revenue, product and request statistics.
- Category management with Cloudinary images.
- Product management with unlimited Cloudinary images, category, visibility, featured flag and multi-type pricing options.
- Order management: status workflow, payment status, confirmed total, courier / tracking details, internal notes and status history.
- Request management: approve / reject / complete cancellations, returns and replacements.
- Deleting a product or category also removes its replaced Cloudinary assets.

### Security
- Supabase Row Level Security on every table.
- Prices are always re-read from the database when an order is placed.
- Orders are created atomically through a Postgres function.
- Cloudinary uploads are signed on the server; the API secret never reaches the browser.
- Only one admin is allowed, enforced by a unique partial index.
- Customers cannot change their own role (protected by a database trigger).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router (React 19) |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase (Postgres + RLS) |
| Images | Cloudinary signed uploads |
| Validation | Zod |
| Icons | Lucide |
| Toasts | Sonner |
| Language | TypeScript |

---

## 1. Prerequisites

- Node.js 20 or newer (Node 22 recommended)
- A Supabase account
- A Cloudinary account

---

## 2. Install

```bash
npm install
```

---

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Public site config
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/your-handle
NEXT_PUBLIC_YOUTUBE_URL=https://www.youtube.com/@your-handle
```

> `.env.local` already exists with placeholders so the project builds. Replace every placeholder before using the app.

Where to find them:

- **Supabase**: Dashboard → your project → **Project Settings → API** → Project URL and `anon` public key.
- **Cloudinary**: Dashboard → **Product Environment Credentials** → Cloud name, API key and API secret.

Never expose `CLOUDINARY_API_SECRET` or use a service-role Supabase key in the browser.

---

## 4. Supabase setup

### 4.1 Create the project
1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**.
3. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.

> **Fast path:** add a Supabase personal access token as `SUPABASE_ACCESS_TOKEN` in `.env.local`, then run `npm run db:setup`. It applies `schema.sql` (only when the tables are missing), `import-catalog.sql` and `order-rules.sql` in one step. The manual steps below do exactly the same thing. Remove the token afterwards.
>
> **Existing projects:** run `npm run db:migrate` (or paste `supabase/order-rules.sql` into the SQL Editor) to add the cancellation-reason column, order/payment guards and request constraints without touching the catalogue.

This creates:

- enums, tables, indexes and relationships
- the one-admin unique index
- profile creation trigger
- role-protection trigger
- address limit (5) and default-address triggers
- `min_price` sync trigger
- order status/payment guards and cancelled-order immutability
- request rules (one return/replacement per order, required rejection reasons)
- atomic `place_order`, `cancel_order` and `request_order_action` functions
- all Row Level Security policies

### 4.2 Import the catalog (one time)
The real catalog lives in [`supabase/import-catalog.sql`](supabase/import-catalog.sql). It inserts the 5 categories, all 33 products and every Inch / Pieces / Size price option from the printed price list.

1. Open **SQL Editor**.
2. Paste the entire contents of `supabase/import-catalog.sql` and run it.
3. The verification queries at the end should report **33 products**.

The import is idempotent — running it again updates the same rows and resets prices to the catalog values instead of creating duplicates. Product photos are not part of the import; add them from **Admin → Products → Edit product → Images**.

> Run `schema.sql` first. The import stops with a clear error if the tables do not exist.

### 4.3 Disable email confirmation (recommended)
New customers should be able to sign in immediately.

1. Supabase Dashboard → **Authentication → Providers → Email**.
2. Turn **Confirm email** off.
3. Save.

If you keep it on, the register form will explain that the account must be confirmed first.

### 4.4 Create the admin account
1. Run the app and register normally at `/register` with the email you want to use as admin.
2. Go back to **SQL Editor** and run:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

Replace the email with your admin email. Only one admin is allowed — the database will reject a second admin.

### 4.5 Check the storage of category images
Category and product images are stored on Cloudinary, not Supabase Storage. No Supabase bucket setup is needed.

---

## 5. Cloudinary setup

1. Create a free Cloudinary account.
2. Copy the **Cloud name**, **API key** and **API secret** into `.env.local`.
3. Uploads are signed by `POST /api/cloudinary/sign`, which is only available to the signed-in admin.
4. Images are uploaded to the folder `subha-fashion-factory/products`.

No upload preset is required. The browser uploads directly to Cloudinary with the signed parameters.

---

## 6. Run the project

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production checks:

```bash
npm run typecheck
npm run build
npm start
```

---

## 7. First-run checklist

The catalog is already imported from `supabase/import-catalog.sql` — 5 categories and 33 products with their price options. Photos are the only thing left to add.

1. Sign in with the admin account.
2. Open **Admin → Products** and confirm all 33 products are listed.
3. Add photos to each product: **Edit product → Images**. The first image becomes the cover.
4. Optionally add a photo to each category in **Admin → Categories**.
5. Confirm the products appear on `/shop` and `/product/<slug>`.
6. Place a test order as a customer.
7. In **Admin → Orders**, open the order:
   - enter the confirmed total after the phone call
   - set payment status
   - move the status through `confirmed → packed → shipped → delivered`
8. After delivery, test a return or replacement request from the customer order page.
9. Test admin approval in **Admin → Requests**.

To add a new product later, use **Admin → Products → Add product** — the import script is only for the original catalog.

---

## 8. Order status rules

```
pending    → confirmed | cancelled
confirmed  → packed    | cancelled
packed     → shipped   | cancelled
shipped    → delivered | cancelled
delivered  → (final)
cancelled  → (final)
```

Payment status only moves forward:

```
pending → paid → refunded
```

- The customer can cancel freely while the order is `pending`, and must select a reason.
- After confirmation, the customer can submit a cancellation **request** (also with a reason) — including while the order is `shipped`.
- Approving a cancellation request automatically cancels the order. Rejecting any request requires a written reason.
- Return / replacement requests are only accepted after delivery, within **7 days**. Only one return **or** replacement is allowed per order.
- A cancelled order is read-only. The only exception is when its payment is still `paid`: it can then be marked `refunded` and nothing else.
- `paid` can never go back to `pending`, and `refunded` can never go back to `paid` or `pending`.
- Moving an order to `shipped` requires **courier**, **tracking number** and a valid **tracking link**; those fields appear in the admin form only while `shipped` is selected.
- Every admin order update opens a confirmation dialog that lists each changed value as `old → new`.

---

## 9. How pricing works

- Cart and checkout show the **items subtotal only**.
- Delivery and final pricing are confirmed by phone; no shipping amount is calculated in the app.
- The admin records the confirmed total on the order (`confirmed_total`).
- The product card “from” price is the cheapest active option, kept up to date by a database trigger.
- Order item prices are snapshotted at placement time, so later product price changes do not alter past orders.

---

## 10. Project structure

```
src/
├─ app/
│  ├─ (store)/              # Customer storefront
│  │  ├─ page.tsx           # Home
│  │  ├─ shop/              # Catalog + filters
│  │  ├─ product/[slug]/    # Product detail
│  │  ├─ cart/              # Cart
│  │  ├─ checkout/          # Checkout
│  │  ├─ login|register/    # Single auth entry point
│  │  ├─ account/           # Profile + addresses
│  │  └─ orders/            # Orders, detail and requests
│  ├─ admin/                # Protected admin dashboard
│  │  ├─ categories/
│  │  ├─ products/
│  │  ├─ orders/
│  │  └─ requests/
│  ├─ api/cloudinary/sign/  # Signed upload endpoint (admin only)
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ error.tsx
│  ├─ loading.tsx
│  └─ not-found.tsx
├─ components/
│  ├─ admin/                # Admin forms, uploader, shell
│  ├─ auth/                 # Login / register forms
│  ├─ cart/                 # Cart context and view
│  ├─ checkout/
│  ├─ account/
│  ├─ orders/
│  ├─ shop/
│  ├─ layout/
│  └─ ui/                   # Button, inputs, modal, badges…
├─ lib/
│  ├─ actions/              # Server actions
│  ├─ supabase/             # Browser / server / middleware clients
│  ├─ auth.ts               # Session helpers + admin gate
│  ├─ config.ts             # Status flow, pricing types, constants
│  ├─ data.ts               # Storefront queries
│  ├─ orders.ts             # Return window helpers
│  ├─ order-rules.ts        # Status/payment transitions and order locking
│  ├─ types.ts
│  ├─ utils.ts
│  └─ validators.ts
└─ middleware.ts            # Session refresh + route protection
supabase/
├─ schema.sql               # Database source of truth (fresh installs)
├─ import-catalog.sql       # One-time import of the real 33-product catalog
└─ order-rules.sql          # Idempotent lifecycle migration for existing databases
scripts/
├─ setup-database.mjs       # npm run db:setup — applies all SQL files
└─ apply-sql.mjs            # npm run db:migrate — applies order-rules.sql
```

---

## 11. Security notes

- `/admin` and all sub-routes call `requireAdmin()`; non-admin sessions receive a 404 immediately.
- Middleware also redirects unauthenticated visits to `/login`.
- Every admin server action re-checks the admin role.
- Admin actions are not callable by customers even if they guess the endpoint.
- RLS restricts customer data to the signed-in user.
- Product prices sent by the browser are ignored; `place_order()` sums prices from `product_options` inside Postgres.
- Cloudinary destroy calls happen server-side after the database record is removed or replaced.

---

## 12. Troubleshooting

**“Missing Supabase environment variables”**
Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then restart `npm run dev`.

**Registration says email confirmation is enabled**
Turn off **Confirm email** in Supabase → Authentication → Providers → Email.

**Admin link does not appear after promotion**
Sign out and sign back in, or refresh the page. The navbar reads the role from the database on each request.

**`/admin` shows 404 for the admin account**
Make sure the promotion SQL updated the row whose `email` matches the account exactly, and that you are signed in with that account.

**Images fail to upload**
Verify all three Cloudinary variables. The upload endpoint returns a clear error when it is not configured. Only the admin can call it.

**“Some items in your cart are no longer available”**
A product or option was hidden or deleted after being added. Remove it from the cart and add a current option.

**Second admin cannot be promoted**
That is intentional. The single-admin unique index rejects it. Demote the current admin first if you truly need to transfer ownership.

---

## 13. Deployment

1. Push the project to a Git provider.
2. Import it into Vercel (or your host of choice).
3. Add every variable from `.env.local` to the hosting environment.
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
5. In Supabase → Authentication → URL Configuration, add the production URL and `/auth/callback`-style redirects if you later enable email links.
6. Deploy. The middleware keeps sessions fresh on Vercel’s edge.

---

## 14. Notes and intentional limitations

- No stock tracking, no shipping calculator and no payment gateway — by design.
- The catalog is imported once from `supabase/import-catalog.sql`. There is no demo or placeholder data.
- Exactly one admin account.
- Return / replacement window is fixed at 7 days in `src/lib/config.ts` and mirrored in the database function.
- Currency is INR (₹).
#   s u b h a _ f a s h i o n _ f a c t o r y  
 