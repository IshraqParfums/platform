# Ishraq Parfums Web

Next.js frontend for Ishraq Parfums.

## Stack

- Next.js 16 + React 19 + Tailwind CSS 4
- `@ishraqparfums/shared` for API contracts

Add other libraries **only where they win** (full table in [`docs/05 - Engineering Standards.md`](../docs/05%20-%20Engineering%20Standards.md) §3.4):

| Add | Win |
|-----|-----|
| Thin `lib/api` + **TanStack Query** | Shared fetch/auth; client cache for lists/PDP/cart/orders/admin tables — not every Server Component |
| **Zod** + **react-hook-form** | Checkout, addresses, OTP, admin forms — not one-click UI |
| **Razorpay Checkout.js** | Pay step after checkout only |
| **nuqs** | Pagination/filters in the URL — not quiz/cart drawers |
| **shadcn/ui** | `/admin` speed — keep the storefront custom |
| **`next/font`** (Fraunces / Manrope) | Shop + bespoke feel — don’t force on admin |

Bespoke look/feel reference: repo-root `Find_Your_Bespoke_Blend-2.html`. Engine: import from `@ishraqparfums/shared`.

## Prerequisites

Install dependencies from the monorepo root:

```bash
pnpm install
```

The API should be running on port 3001 for the backend health check on the homepage.

## Scripts

From the monorepo root:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web typecheck
```

From this directory:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

## Development

```bash
pnpm dev
```

App URL: http://localhost:3000

## Project structure

```text
web/
├── app/
│   ├── api/auth/         Shop BFF auth (OTP, refresh, logout) → httpOnly cookies
│   ├── api/admin/auth/   Admin BFF auth (login, refresh, logout) → httpOnly cookies
│   └── ...
├── components/
├── lib/
│   ├── api/              nestFetch (dumb), authFetch (refresh-once), errors
│   ├── auth/             cookie names, session create/clear/refresh
│   ├── config.ts         NEST_API_BASE_URL
│   └── api.ts            Public helpers (e.g. fetchHealth)
└── public/
```

## Auth (BFF + httpOnly cookies)

Nest remains Bearer/JSON for Postman. The browser should call **Next** auth routes only — tokens are stored in httpOnly cookies and **never** returned in BFF JSON.

| Role | Routes | Cookies |
|------|--------|---------|
| Shop | `POST /api/auth/otp/request`, `/otp/verify`, `/refresh`, `/logout` | `ishraq_shop_at`, `ishraq_shop_rt` |
| Admin | `POST /api/admin/auth/login`, `/refresh`, `/logout` | `ishraq_admin_at`, `ishraq_admin_rt` |

- Verify/login responses: `{ customer }` or `{ admin, expiresIn }` only.
- Server helpers: `shopAuthFetch` / `adminAuthFetch` attach Bearer from cookies and refresh once on 401.
- Guest cart / bespoke saves stay in **localStorage** until merge (not auth cookies).

Copy [`web/.env.example`](.env.example) to `.env.local` and set `NEST_API_BASE_URL`.

## API client

`lib/api.ts` — browser-safe helpers (health). Authenticated Nest calls go through `lib/api/nest.ts` / `auth-fetch.ts` on the server (BFF or RSC).

```ts
import { fetchHealth } from "@/lib/api";
```

## Shared package

This app depends on `@ishraqparfums/shared`. `next.config.ts` includes:

```ts
transpilePackages: ["@ishraqparfums/shared"]
```

Build `packages/shared` before building web if you are not using Turbo from the repo root.
