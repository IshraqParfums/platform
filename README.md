# Ishraq Parfums

Monorepo for the Ishraq Parfums e-commerce platform.

## Repository layout

```text
ishraqparfums/
├── docs/              Product and engineering documentation
├── web/               Next.js frontend (storefront + admin)
├── api/               NestJS backend
└── packages/
    └── shared/        Shared TypeScript contracts
```

## Prerequisites

- Node.js 20+
- pnpm 11.10.0 (`corepack enable` recommended)

## Setup

```bash
pnpm install
```

## Scripts

Run from the repository root:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Typecheck all packages |

## Development

Start the full stack:

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Health check: http://localhost:3001/api/v1/health

Run a single package:

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter @ishraqparfums/shared build
```

## Package documentation

- [web/README.md](web/README.md)
- [api/README.md](api/README.md)
- [packages/shared/README.md](packages/shared/README.md)

## Architecture

```text
web  →  @ishraqparfums/shared  ←  api
```

Changes in `packages/shared` affect both `web` and `api`.
