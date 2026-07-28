# Ishraq Parfums API

NestJS backend for Ishraq Parfums.

## Stack

- NestJS 11
- TypeScript
- Prisma 6 + PostgreSQL (Supabase)
- `@ishraqparfums/shared` for API contracts
- Razorpay for payments

## Prerequisites

Install dependencies from the monorepo root:

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env
```

Fill in Supabase `DATABASE_URL` / `DIRECT_URL`, auth secrets (`JWT_SECRET`, `OTP_PEPPER`, `SUPABASE_JWT_SECRET`), `SUPABASE_SERVICE_ROLE_KEY` (product image uploads), and Razorpay keys before running checkout.

## Scripts

From the monorepo root:

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api lint
```

From this directory:

```bash
pnpm dev
pnpm build
pnpm start:prod
pnpm lint
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:studio
```

## Database

Catalog prices are stored as **paise** (`pricePaise`, INR × 100). Example: ₹2,499 → `249900`.

Optional `compareAtPricePaise` on variants is MRP / strikethrough display only. Public APIs expose it only when it is greater than `pricePaise`.

Product status values: `DRAFT`, `ACTIVE`, `ARCHIVED`, `DELETED` (soft delete; rows are not physically removed).

Customer identity is **phone** (E.164 `+91…`). `Customer.name` / `Customer.email` are optional at OTP login; set via `PATCH /customers/me` or required at checkout (also snapshotted onto the order for invoices / history).

Variant inventory uses `stockQty` and `reservedQty`. Sellable quantity is `stockQty - reservedQty`. Checkout reserves stock for ~11 minutes while Razorpay accepts payment for ~10 minutes.

Reviews: one per customer per product (`@@unique([customerId, productId])`). Verified Buyer is **derived on read** from paid order history (not stored on the review).

Apply schema and seed demo catalog data:

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

## Development

```bash
pnpm prisma:generate
pnpm dev
```

Default URL: http://localhost:3001

In development, OTPs are **logged** by Nest (`DEV OTP for +91…: ######`) and never returned in HTTP responses.

## Pagination

List endpoints that can grow return:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 20 }
```

Query params: `?page=1&pageSize=20`

| Constant | Value |
|----------|-------|
| Default page | `1` |
| Default page size | `20` |
| Max page size | `100` |

Paginated today: `GET /products`, `GET /orders`, `GET /products/:slug/reviews`, `GET /reviews/me`, `GET /bespoke`, `GET /admin/products`, `GET /admin/orders`, `GET /admin/customers`.

Not paginated: cart, addresses, collections.

**Breaking (pre-FE):** `GET /products` and `GET /orders` no longer return bare arrays.

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP server port (default `3001`) |
| `DATABASE_URL` | Pooled Postgres URL used by the running app |
| `DIRECT_URL` | Direct Postgres URL used by Prisma Migrate |
| `JWT_SECRET` | HS256 secret for customer access tokens |
| `JWT_EXPIRES_IN` | Customer JWT lifetime (default `7d`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret (verify admin Bearer tokens) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only; product image uploads to Storage) |
| `SUPABASE_STORAGE_BUCKET` | Public bucket for product images (default `product-images`) |
| `OTP_PEPPER` | Pepper for hashing OTP codes at rest |
| `OTP_TTL_SECONDS` | OTP lifetime (default `300`) |
| `OTP_RESEND_COOLDOWN_SECONDS` | Min seconds between OTP requests (default `60`) |
| `OTP_MAX_PER_15_MIN` | Max OTP requests per phone / 15 min (default `5`) |
| `OTP_MAX_PER_DAY` | Max OTP requests per phone / UTC day (default `10`) |
| `OTP_MAX_VERIFY_ATTEMPTS` | Max wrong verifies per challenge (default `5`) |
| `SHIPPING_PAISE` | Flat shipping in paise (default `5000` = ₹50); snapshotted on each order |
| `CHECKOUT_RAZORPAY_WINDOW_SECONDS` | Razorpay order `expire_by` window (default `600` = 10 min) |
| `CHECKOUT_RESERVATION_TTL_SECONDS` | Stock hold TTL (default `660` = 11 min); must be ≥ Razorpay window |
| `RAZORPAY_KEY_ID` | Razorpay key id (test or live) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |
| `BESPOKE_PAISE_PER_ML` | Bespoke price in paise per ml (default `1000` = ₹10/ml) |
| `BESPOKE_ALLOWED_SIZES_ML` | Comma-separated bottle sizes (default `30,50,100`) |

## Auth notes

- Resend OTP = call `POST /auth/otp/request` again (no separate route). Limits apply in **dev and prod**.
- Distinct errors for cooldown, rate limits, expired / invalid / too many attempts.
- On OTP `429`, body includes `retryAfterSeconds` and `limit` (`cooldown` | `window_15m` | `daily`) so the FE can show a countdown after reload.
- Admin: create a Supabase Auth user, then insert into `admins`:

```sql
INSERT INTO admins (id, "supabaseUserId", email, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  '<supabase-auth-user-uuid>',
  'admin@example.com',
  NOW(),
  NOW()
);
```

Pass the Supabase access token as `Authorization: Bearer <token>` to admin routes.

## Checkout / payments

1. Customer JWT required (guests cannot checkout).
2. Save a delivery address via `/customers/addresses`.
3. `POST /checkout` with `{ addressId, name, email }` validates the cart (catalog + bespoke), snapshots prices/address/identity/formula, **reserves stock only for catalog lines**, creates a `PENDING_PAYMENT` order, and returns Razorpay pay payload.
4. Customer pays in Razorpay (10 min window).
5. FE calls `POST /payments/razorpay/verify` **and/or** Razorpay posts to `POST /webhooks/razorpay`. Both use the same idempotent finalize path.
6. On success: order → `ORDER_RECEIVED`, stock commit, cart cleared.
7. While confirming, FE should poll `GET /orders/:id` — do not treat a failed FE verify as payment failure if the webhook may still land.
8. A Nest cron (`@nestjs/schedule`, every minute) reconciles expired `PENDING_PAYMENT` orders: asks Razorpay first, then finalizes or releases the hold.

Configure the webhook URL in Razorpay dashboard to: `https://<your-host>/api/v1/webhooks/razorpay`.

## Reviews

- Any logged-in customer may create **one** review per ACTIVE product (`rating` 1–5; optional `title` / `body`).
- Edit via `PATCH /reviews/:id` (owner only; other owners → 404).
- Public list: `GET /products/:slug/reviews` includes `ratingAverage`, `ratingCount`, `ratingBreakdown`.
- `isVerifiedBuyer` is computed from orders in `ORDER_RECEIVED` … `DELIVERED` that include a variant of that product — never stored on the review row.
- Product list/detail include `ratingAverage` / `reviewCount` (null / 0 when none).
- No moderation or delete in V1.

## Bespoke

Engine + quiz data live in `@ishraqparfums/shared` (`packages/shared/src/bespoke`) — exact port of `Find_Your_Bespoke_Blend-2.html`. The API does **not** re-run scoring on save (HTML uses RNG).

- **Save only on explicit Save:** guests keep formulas in FE localStorage; logged-in `POST /bespoke` persists to DB.
- After login, FE should `POST /bespoke/merge` with local saved payloads (`clientKey` makes merge idempotent).
- Owner-only list/get/rename/delete. Delete also removes cart lines for that formula.
- Price: `sizeMl × BESPOKE_PAISE_PER_ML`, size chosen at **add-to-cart** (`POST /cart/items/bespoke`). Server stamps price; never trust client unit prices.
- No inventory reservation for bespoke. Mixed carts checkout normally; expiry/finalize only touch catalog stock.
- Optional `POST /bespoke/preview` runs `computeResult` without persisting (handy for Postman).

## Admin

All `/admin/*` routes (except `GET /admin/me`) require `Authorization: Bearer <Supabase access token>` for a user with a matching row in `admins` — see [Auth notes](#auth-notes) for bootstrapping one.

- **Product status transitions:** `DRAFT ↔ ACTIVE`, `ACTIVE ↔ ARCHIVED`, either → `DELETED`. `DELETED` is terminal (no restore in V1). Same-status PATCH is a no-op. Invalid transitions → `400`.
- **Product/collection `slug`** is editable via PATCH — safe because `OrderItem.productName` / `productSlug` are snapshot columns, not live joins, so past orders are unaffected.
- **Variants have no hard delete** — a variant that was ever ordered/carted can't be removed (`onDelete: Restrict`). Use `PATCH .../variants/:id { isAvailable: false }` to take it off sale instead.
- **Images**: `POST .../images` is `multipart/form-data` — a `file` field (jpeg/png/webp, ≤ 5MB) plus optional `altText`/`displayOrder` text fields, uploaded to Supabase Storage (`MediaModule`, service-role writes, public-read bucket) and returned as a public `url`. `url` is immutable after creation (delete + recreate to swap the picture, no replace-file endpoint in V1). `DELETE` removes the Storage object first (best-effort — failures are logged, not fatal) then the DB row; seed rows with an external placeholder `url` and no Storage object (`storagePath = null`) delete cleanly with the Storage step skipped.
  - **Intended FE contract:** stage picked files locally (e.g. object URLs for preview) and only call this endpoint when the admin clicks **Save** — not on file-select. For a brand-new product: create the product first (`POST /admin/products`), then upload each staged image against the returned `productId`. This is FE orchestration, not a special API mode — there is no combined "create product + images" endpoint by design.
- **Inventory adjustment** (`PATCH .../variants/:id/stock`) accepts exactly one of `{ adjustment: number }` (delta — positive to restock, negative for damage/shrinkage) or `{ stockQty: number }` (absolute set, e.g. after a physical count). Sending both or neither → `400`. Resulting stock can't go negative or below the variant's `reservedQty` (units already held by in-flight checkouts).
- **Order status** is admin-driven, strictly forward, one step at a time, through the V1 fulfillment pipeline: `ORDER_RECEIVED → CONFIRMED → IN_PRODUCTION → READY_FOR_DISPATCH → DISPATCHED → DELIVERED`. No skipping, no going back, no cancellation (per spec). `PENDING_PAYMENT` / `EXPIRED` / `NEEDS_REVIEW` / `FAILED` are system-managed and rejected if set via this endpoint; an order must first reach `ORDER_RECEIVED` (via payment finalize) before an admin can advance it.
- **Customer management** is basic: search/list, view detail with `orderCount`, edit `name`/`email` (same validation as the customer-facing `PATCH /customers/me`, just without the ownership check).

As with the rest of the API, admin write paths have **no automated test coverage** yet — verify manually via curl/Postman.

**Storage setup (one-time, Supabase dashboard):** create a bucket named `product-images` (or match `SUPABASE_STORAGE_BUCKET`) with public read access and no anon/authenticated write policies — the API writes to it only via the service role key, never from the browser. Object keys are `{productId}/{uuid}.{ext}`.

## Project structure

```text
api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                 # pagination helpers
│   └── modules/
│       ├── health/
│       ├── prisma/
│       ├── product/
│       ├── media/                # Supabase Storage uploads (product images)
│       ├── bespoke/
│       ├── cart/
│       ├── address/
│       ├── order/
│       ├── payment/
│       ├── review/
│       ├── auth/
│       ├── customer/
│       └── admin/
└── package.json
```
## API

Global prefix: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Service health check |
| `GET` | `/api/v1/collections` | List collections |
| `GET` | `/api/v1/products` | Paginated ACTIVE product cards; `?collection=<slug>&page=&pageSize=` |
| `GET` | `/api/v1/products/:slug` | ACTIVE product detail (+ ratings) |
| `GET` | `/api/v1/products/:slug/reviews` | Paginated reviews + aggregates |
| `POST` | `/api/v1/products/:slug/reviews` | Create review (customer JWT) |
| `GET` | `/api/v1/reviews/me` | My reviews (paginated, customer JWT) |
| `PATCH` | `/api/v1/reviews/:id` | Edit own review |
| `POST` | `/api/v1/auth/otp/request` | Request / resend OTP (`{ phone }`) |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP → customer JWT |
| `GET` | `/api/v1/customers/me` | Current customer (Bearer customer JWT) |
| `PATCH` | `/api/v1/customers/me` | Update `{ name?`, `email? }` (at least one) |
| `GET` | `/api/v1/customers/addresses` | List saved addresses |
| `POST` | `/api/v1/customers/addresses` | Create address |
| `PATCH` | `/api/v1/customers/addresses/:id` | Update address / set default |
| `DELETE` | `/api/v1/customers/addresses/:id` | Delete address |
| `GET` | `/api/v1/cart` | Get or create cart (Bearer customer JWT) |
| `POST` | `/api/v1/cart/items` | Add or increment catalog line `{ variantId, quantity }` |
| `POST` | `/api/v1/cart/items/bespoke` | Add bespoke line `{ bespokePerfumeId, sizeMl, quantity }` |
| `PATCH` | `/api/v1/cart/items/:itemId` | Set line quantity `{ quantity }` (≥ 1) |
| `DELETE` | `/api/v1/cart/items/:itemId` | Remove cart line |
| `POST` | `/api/v1/cart/merge` | Merge guest **catalog** cart `{ items: [{ variantId, quantity }] }` → `{ cart, warnings }` |
| `POST` | `/api/v1/bespoke/preview` | Run engine preview (no persist) |
| `POST` | `/api/v1/bespoke` | Save formula (customer JWT) |
| `POST` | `/api/v1/bespoke/merge` | Merge guest-saved formulas (customer JWT) |
| `GET` | `/api/v1/bespoke` | Paginated own formulas |
| `GET` | `/api/v1/bespoke/:id` | Get own formula |
| `PATCH` | `/api/v1/bespoke/:id` | Rename `{ name }` |
| `DELETE` | `/api/v1/bespoke/:id` | Delete formula (+ cart lines) |
| `POST` | `/api/v1/checkout` | `{ addressId, name, email }` → Razorpay pay payload |
| `POST` | `/api/v1/payments/razorpay/verify` | Verify client payment signature → finalize order |
| `POST` | `/api/v1/webhooks/razorpay` | Razorpay webhook (signature header; no JWT) |
| `GET` | `/api/v1/orders` | Paginated customer order history |
| `GET` | `/api/v1/orders/:id` | Order detail (poll while confirming payment) |
| `GET` | `/api/v1/admin/me` | Current admin (Bearer Supabase JWT + `admins` row) |
| `POST` | `/api/v1/admin/collections` | Create collection `{ name, slug, description? }` |
| `PATCH` | `/api/v1/admin/collections/:id` | Update collection |
| `GET` | `/api/v1/admin/products` | Paginated products, any status; `?status=&collectionId=&search=&page=&pageSize=` |
| `GET` | `/api/v1/admin/products/:id` | Product detail, any status |
| `POST` | `/api/v1/admin/products` | Create product `{ collectionId, name, slug, shortDescription, detailedDescription, status? }` |
| `PATCH` | `/api/v1/admin/products/:id` | Update product, incl. status transitions |
| `POST` | `/api/v1/admin/products/:productId/variants` | Create variant `{ sizeMl, pricePaise, compareAtPricePaise?, sku?, stockQty? }` |
| `PATCH` | `/api/v1/admin/products/:productId/variants/:variantId` | Update price / `compareAtPricePaise` / `sku` / `isAvailable` |
| `PATCH` | `/api/v1/admin/products/:productId/variants/:variantId/stock` | Adjust stock — exactly one of `{ adjustment }` or `{ stockQty }` |
| `POST` | `/api/v1/admin/products/:productId/images` | Add image — `multipart/form-data`: `file` (jpeg/png/webp, ≤5MB) + `altText?` + `displayOrder?` |
| `PATCH` | `/api/v1/admin/products/:productId/images/:imageId` | Update `altText` / `displayOrder` |
| `DELETE` | `/api/v1/admin/products/:productId/images/:imageId` | Remove image |
| `GET` | `/api/v1/admin/orders` | Paginated orders, all customers; `?status=&customerId=&page=&pageSize=` |
| `GET` | `/api/v1/admin/orders/:id` | Order detail, no ownership restriction |
| `PATCH` | `/api/v1/admin/orders/:id/status` | Advance fulfillment status `{ status }` |
| `GET` | `/api/v1/admin/customers` | Paginated customers; `?search=&page=&pageSize=` (matches phone/email/name) |
| `GET` | `/api/v1/admin/customers/:id` | Customer detail incl. `orderCount` |
| `PATCH` | `/api/v1/admin/customers/:id` | Update `{ name?, email? }` |

Catalog routes stay public. Customer email is not required for OTP.

Cart routes require a customer JWT. Cart lines are `kind: 'catalog' | 'bespoke'`. Catalog prices are live from variants; bespoke prices are live from `sizeMl × BESPOKE_PAISE_PER_ML` (snapshotted at checkout).

**Guest cart merge:** OTP verify does **not** merge a guest cart. After login, the FE should call `POST /api/v1/cart/merge` with localStorage **catalog** lines, and `POST /api/v1/bespoke/merge` for saved formulas. Unsellable catalog lines are skipped with a warning; over-stock quantities are clamped with a warning.

## Shared package

This app depends on `@ishraqparfums/shared` for catalog, auth, cart, address, order, payment, review, bespoke, admin (product/order/customer write), and pagination contracts.

Build `packages/shared` before building api if you are not using Turbo from the repo root.
