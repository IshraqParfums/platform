# @ishraqparfums/shared

Shared TypeScript contracts used by `web` and `api`.

## Purpose

This package holds framework-agnostic types and contracts shared across the monorepo.

Current exports:

- `HealthResponse`

## Structure

```text
packages/shared/src/
├── health/
│   ├── health-response.ts
│   └── index.ts
└── index.ts
```

## Scripts

From the monorepo root:

```bash
pnpm --filter @ishraqparfums/shared build
pnpm --filter @ishraqparfums/shared lint
pnpm --filter @ishraqparfums/shared typecheck
```

From this directory:

```bash
pnpm build
pnpm lint
pnpm typecheck
```

## Build output

`pnpm build` compiles TypeScript to `dist/`.

Import example:

```ts
import type { HealthResponse } from "@ishraqparfums/shared";
```

## Adding a contract

1. Add the type under `src/<feature>/`
2. Export it from the feature `index.ts`
3. Re-export it from `src/index.ts`
4. Run `pnpm build`

## Dependents

- `web`
- `api`
