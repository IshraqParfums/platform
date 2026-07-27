# Ishraq Parfums API

NestJS backend for Ishraq Parfums.

## Stack

- NestJS 11
- TypeScript
- `@ishraqparfums/shared` for API contracts

## Prerequisites

Install dependencies from the monorepo root:

```bash
pnpm install
```

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
```

## Development

```bash
pnpm dev
```

Default URL: http://localhost:3001

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |

## Project structure

```text
api/src/
├── main.ts           App bootstrap
├── app.module.ts     Root module
└── modules/
    └── health/       Health check module
```

## API

Global prefix: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Service health check |

Example response:

```json
{
  "status": "healthy",
  "service": "ishraqparfums-api",
  "timestamp": "2026-07-06T17:05:55.344Z"
}
```

## Shared package

This app depends on `@ishraqparfums/shared` for response types such as `HealthResponse`.

Build `packages/shared` before building api if you are not using Turbo from the repo root.
