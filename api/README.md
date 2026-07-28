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

Fill in Supabase `DATABASE_URL` / `DIRECT_URL`, auth secrets (`JWT_SECRET`, `OTP_PEPPER`, `SUPABASE_JWT_SECRET`), and Razorpay keys before running checkout.

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

Customer identity is **phone** (E.164 `+91…`). `Customer.name` / `Customer.email` are optional at OTP login and **required at checkout** (also snapshotted onto the order for invoices / history).

Variant inventory uses `stockQty` and `reservedQty`. Sellable quantity is `stockQty - reservedQty`. Checkout reserves stock for ~11 minutes while Razorpay accepts payment for ~10 minutes.

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
3. `POST /checkout` with `{ addressId, name, email }` validates the cart, snapshots prices/address/identity, reserves stock, creates a `PENDING_PAYMENT` order, and returns Razorpay pay payload.
4. Customer pays in Razorpay (10 min window).
5. FE calls `POST /payments/razorpay/verify` **and/or** Razorpay posts to `POST /webhooks/razorpay`. Both use the same idempotent finalize path.
6. On success: order → `ORDER_RECEIVED`, stock commit, cart cleared.
7. While confirming, FE should poll `GET /orders/:id` — do not treat a failed FE verify as payment failure if the webhook may still land.
8. A Nest cron (`@nestjs/schedule`, every minute) reconciles expired `PENDING_PAYMENT` orders: asks Razorpay first, then finalizes or releases the hold.

Configure the webhook URL in Razorpay dashboard to: `https://<your-host>/api/v1/webhooks/razorpay`.

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
│   └── modules/
│       ├── health/
│       ├── prisma/
│       ├── product/
│       ├── cart/
│       ├── address/
│       ├── order/
│       ├── payment/
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
| `GET` | `/api/v1/products` | Lean ACTIVE product cards; optional `?collection=<slug>` |
| `GET` | `/api/v1/products/:slug` | ACTIVE product detail |
| `POST` | `/api/v1/auth/otp/request` | Request / resend OTP (`{ phone }`) |
| `POST` | `/api/v1/auth/otp/verify` | Verify OTP → customer JWT |
| `GET` | `/api/v1/customers/me` | Current customer (Bearer customer JWT) |
| `GET` | `/api/v1/customers/addresses` | List saved addresses |
| `POST` | `/api/v1/customers/addresses` | Create address |
| `PATCH` | `/api/v1/customers/addresses/:id` | Update address / set default |
| `DELETE` | `/api/v1/customers/addresses/:id` | Delete address |
| `GET` | `/api/v1/cart` | Get or create cart (Bearer customer JWT) |
| `POST` | `/api/v1/cart/items` | Add or increment line `{ variantId, quantity }` |
| `PATCH` | `/api/v1/cart/items/:itemId` | Set line quantity `{ quantity }` (≥ 1) |
| `DELETE` | `/api/v1/cart/items/:itemId` | Remove cart line |
| `POST` | `/api/v1/cart/merge` | Merge guest cart `{ items: [{ variantId, quantity }] }` → `{ cart, warnings }` |
| `POST` | `/api/v1/checkout` | `{ addressId, name, email }` → Razorpay pay payload |
| `POST` | `/api/v1/payments/razorpay/verify` | Verify client payment signature → finalize order |
| `POST` | `/api/v1/webhooks/razorpay` | Razorpay webhook (signature header; no JWT) |
| `GET` | `/api/v1/orders` | Customer order history |
| `GET` | `/api/v1/orders/:id` | Order detail (poll while confirming payment) |
| `GET` | `/api/v1/admin/me` | Current admin (Bearer Supabase JWT + `admins` row) |

Catalog routes stay public. Customer email is not required for OTP.

Cart routes require a customer JWT. Prices in cart responses are live from variants (not snapshotted until checkout).

**Guest cart merge:** OTP verify does **not** merge a guest cart. After login, the FE should call `POST /api/v1/cart/merge` with localStorage lines. Unsellable lines are skipped with a warning; over-stock quantities are clamped with a warning.

## Shared package

This app depends on `@ishraqparfums/shared` for catalog, auth, cart, address, order, and payment contracts.

Build `packages/shared` before building api if you are not using Turbo from the repo root.
