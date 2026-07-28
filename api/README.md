# Ishraq Parfums API

NestJS backend for Ishraq Parfums.

## Stack

- NestJS 11
- TypeScript
- Prisma 6 + PostgreSQL (Supabase)
- `@ishraqparfums/shared` for API contracts

## Prerequisites

Install dependencies from the monorepo root:

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env
```

Fill in Supabase `DATABASE_URL` / `DIRECT_URL`, plus auth secrets (`JWT_SECRET`, `OTP_PEPPER`, `SUPABASE_JWT_SECRET`) before running the API.

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

Customer identity is **phone** (E.164 `+91…`). `Customer.email` is optional and not required at OTP login (collect at checkout later).

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
| `GET` | `/api/v1/admin/me` | Current admin (Bearer Supabase JWT + `admins` row) |

Catalog routes stay public. Customer email is not required for OTP.

## Shared package

This app depends on `@ishraqparfums/shared` for catalog and auth contracts.

Build `packages/shared` before building api if you are not using Turbo from the repo root.
