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

Fill in Supabase `DATABASE_URL` and `DIRECT_URL` before running the API or migrations.

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

Product status values: `DRAFT`, `ACTIVE`, `ARCHIVED`, `DELETED` (soft delete; rows are not physically removed).

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

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP server port (default `3001`) |
| `DATABASE_URL` | Pooled Postgres URL used by the running app |
| `DIRECT_URL` | Direct Postgres URL used by Prisma Migrate |

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
│       └── prisma/
└── package.json
```

## API

Global prefix: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Service health check |

## Shared package

This app depends on `@ishraqparfums/shared` for response types such as `HealthResponse`.

Build `packages/shared` before building api if you are not using Turbo from the repo root.
