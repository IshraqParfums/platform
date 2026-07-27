# 05 - Engineering Standards

**Project:** Ishraq Parfums
**Document Version:** 1.0
**Status:** Draft (Version 1 / MVP)

---

# 1. Purpose

This document defines the engineering practices and development standards for the Ishraq Parfums platform.

Its objectives are to:

* Maintain a consistent codebase.
* Improve developer productivity.
* Reduce bugs through standardized workflows.
* Ensure long-term maintainability.
* Establish common development practices across the team.

This document does not define business requirements or system architecture.

---

# 2. Engineering Principles

Development should prioritize:

* Simplicity over unnecessary abstraction.
* Readability over clever implementations.
* Consistency across the codebase.
* Separation of concerns.
* Reusable components where appropriate.
* Maintainable code over premature optimization.

---

# 3. Repository Structure

The project should be maintained in a single monorepo.

## 3.1 Top-level layout

```text
ishraq-parfums/

├── docs/
├── web/                 # Next.js frontend (storefront + /admin)
├── api/                 # NestJS backend
└── packages/
    └── shared/          # Shared TypeScript contracts (@ishraqparfums/shared)
```

General rules:

* Documentation belongs in `docs/`.
* Frontend code belongs in `web/`.
* Backend code belongs in `api/`.
* Shared contracts and types belong in `packages/shared/`.
* Shared packages must not contain business logic, UI, or infrastructure adapters.

## 3.2 Monorepo tooling

* **Package manager:** pnpm workspaces
* **Task runner:** Turborepo (`dev`, `build`, `lint`, `typecheck`)
* **Language:** TypeScript across `web`, `api`, and `packages/shared`

Typical root scripts:

```text
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

Package filters (examples):

```text
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter @ishraqparfums/shared build
```

Dependency direction:

```text
web  →  @ishraqparfums/shared  ←  api
```

Changes in `packages/shared` should invalidate / revalidate both `web` and `api`.

## 3.3 Backend folder structure (`api/`)

Logical modules are defined in Backend Design. Physical layout:

```text
api/
├── prisma/                    # Prisma schema and migrations
├── src/
│   ├── main.ts                # App bootstrap
│   ├── app.module.ts          # Root module
│   ├── common/                # Nest-only helpers (filters, guards, pipes)
│   └── modules/
│       ├── health/
│       ├── auth/
│       ├── customer/
│       ├── product/           # Includes inventory on variants
│       ├── bespoke/
│       ├── cart/
│       ├── orders/
│       ├── payments/
│       ├── reviews/
│       ├── admin/
│       └── media/
└── package.json
```

Each feature module typically owns:

* `*.module.ts`
* `*.controller.ts`
* `*.service.ts`
* data access (Prisma repository / service)
* DTOs / validation

API global prefix: `/api/v1`.

## 3.4 Frontend folder structure (`web/`)

```text
web/
├── app/                       # Next.js App Router
│   ├── (shop)/                # Customer storefront routes
│   ├── admin/                 # Admin panel under /admin
│   ├── layout.tsx
│   └── ...
├── components/                # Shared UI components
├── lib/                       # API client, auth helpers, localStorage cart
├── hooks/                     # Optional shared hooks
├── public/                    # Static assets
└── package.json
```

Guidelines:

* Prefer App Router route groups for storefront vs admin.
* Keep API calls in `lib/` (or feature helpers), not scattered inside random components.
* Use TanStack Query for server-state fetching/caching on the client.
* Guest cart and temporary bespoke results live in browser local storage until login merge.

## 3.5 Shared package structure (`packages/shared/`)

```text
packages/shared/
└── src/
    ├── health/
    ├── <feature>/             # Types and contracts only
    └── index.ts
```

Rules:

* Export framework-agnostic TypeScript types and contracts.
* Do not put Nest providers, React components, or Prisma clients here.
* Both `web` and `api` consume this package via the workspace dependency.

---

# 4. Branching Strategy

Recommended branches:

* `main` – Production-ready code.
* `dev` – Integration branch.
* `feature/*` – New features.
* `fix/*` – Bug fixes.

Rules:

* Do not commit directly to `main`.
* Pull requests should target `dev`.
* Merge to `main` only after review and validation.

---

# 5. Commit Standards

Use Conventional Commits.

Examples:

```text
feat(product): add product variants

fix(cart): prevent duplicate items

refactor(review): simplify validation

docs(database): update entity relationships
```

Avoid generic commit messages such as:

```text
update

fix

changes
```

---

# 6. Code Organization

Organize code by feature / business module rather than by technical layer alone.

Backend modules (see also System Design and Backend Design):

* Auth
* Customer
* Product (includes inventory on variants)
* Bespoke
* Cart
* Orders
* Payments
* Reviews
* Admin
* Media
* Health

Physical folder trees for `api/`, `web/`, and `packages/shared/` are defined in §3 Repository Structure.

Each backend module should own:

* Controllers
* Services
* Data access
* DTOs
* Validation

---

# 7. Code Quality

Guidelines:

* Keep functions focused on one responsibility.
* Prefer composition over duplication.
* Use descriptive naming.
* Keep business logic out of controllers.
* Keep repositories focused on data access.
* Avoid circular dependencies between modules.

---

# 8. Error Handling

Errors should be:

* Predictable.
* Consistent.
* User-friendly where exposed externally.
* Detailed enough for debugging internally.

Do not expose sensitive implementation details in API responses.

---

# 9. Validation Standards

Validate data at multiple levels:

* Request validation.
* Business rule validation.
* Database constraint validation.

Never rely on client-side validation alone.

---

# 10. Pull Request Standards

Each pull request should:

* Address a single logical change.
* Include a clear description.
* Explain why the change is required.

Reviewers should evaluate:

* Correctness.
* Readability.
* Maintainability.
* Backward compatibility.
* Impact on existing functionality.

---

# 11. Documentation Standards

Documentation should evolve alongside the codebase.

When introducing a new feature:

* Update relevant architecture documents if behavior changes.
* Document important engineering decisions.
* Avoid duplicate documentation across multiple files.

The documentation hierarchy is:

1. Functional Specification
2. System Design
3. Database Design
4. Backend Design
5. Engineering Standards

---

# 12. Security Practices

Development should follow these principles:

* Validate all external input.
* Apply authentication before protected operations.
* Enforce authorization consistently.
* Store secrets outside the source code.
* Use least-privilege access wherever possible.
* Never log OTP values, tokens, or secrets in production.
* In development only, OTP may be logged to the server console for local development.

---

# 13. Logging

Logging should help diagnose issues without exposing sensitive data.

Log:

* Important business events.
* Unexpected failures.
* Background task failures.
* Payment verification outcomes (without sensitive payloads).

Do not log in production:

* Passwords.
* OTP values.
* Tokens.
* Sensitive customer information.

In development, OTP values may be logged intentionally so WhatsApp delivery is not required.

---

# 14. Performance Guidelines

Prefer:

* Efficient database queries.
* Appropriate indexing.
* Pagination for list endpoints.
* Lazy loading where appropriate.
* Caching only when justified by measured needs.

Avoid optimization without evidence of a bottleneck.

---

# 15. Version 1 Engineering Notes

Settled Version 1 decisions that engineers should treat as given:

* Stack: TypeScript, pnpm + Turborepo, Next.js, NestJS, PostgreSQL, Prisma, Tailwind, TanStack Query, Zod.
* Shared contracts live in `@ishraqparfums/shared`.
* Customer auth: WhatsApp OTP (log-only in development).
* Admin auth: Supabase email/password.
* File storage: Supabase Storage.
* Payments: Razorpay.
* Shipping: flat ₹50.
* Bespoke offer: ₹1,000 / 100 ml.
* Guest cart + recommendation: browser local storage, merge on login.
* Product lifecycle: Draft ↔ Active; Archived is terminal.
* No order cancellation in Version 1.
* Inventory lives on product variants inside the Product module.
* Bespoke questionnaire/scoring remains application code for Version 1 (ported from the existing HTML prototype), not a database CMS.
* Prefer server-side (or shared-package) scoring so persisted formulas are authoritative; store result + answer snapshot only.
* Redis and dedicated search engines are out of Version 1 unless a measured need appears.

---

# 16. Future Engineering Considerations

The engineering approach should accommodate future additions such as:

* Background job processing.
* Distributed caching.
* Search optimization.
* Address-based shipping.
* Notification providers.
* Questionnaire CMS.
* Monitoring and observability.
* Order cancellation flows.

These should integrate without requiring major architectural changes.

---

# 17. Summary

The engineering standards establish a shared development approach for Ishraq Parfums.

Following these standards promotes consistency, maintainability, and reliable software delivery while allowing the project to evolve without unnecessary technical debt.
