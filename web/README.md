# Ishraq Parfums Web

Next.js frontend for Ishraq Parfums.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- `@ishraqparfums/shared` for API contracts

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
├── app/              App Router pages, layout, and styles
├── components/       React components
├── lib/              API client functions
└── public/           Static assets
```

## API client

`lib/api.ts` contains frontend API calls. It currently uses `http://localhost:3001` as the API base URL.

Example:

```ts
import { fetchHealth } from "@/lib/api";
```

## Shared package

This app depends on `@ishraqparfums/shared`. `next.config.ts` includes:

```ts
transpilePackages: ["@ishraqparfums/shared"]
```

Build `packages/shared` before building web if you are not using Turbo from the repo root.
