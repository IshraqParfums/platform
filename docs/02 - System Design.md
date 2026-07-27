# 02 - System Design

**Project:** Ishraq Parfums
**Document Version:** 1.0
**Status:** Draft (Version 1 / MVP)

---

# 1. Purpose

This document defines the overall system architecture of the Ishraq Parfums platform.

It describes how the system is organized into logical modules, how different parts of the application interact, how future features can be introduced without major restructuring, and which technologies are selected for Version 1.

Physical repository folder layouts and day-to-day engineering conventions are documented in Engineering Standards.

---

# 2. Design Goals

The system should:

* Be simple to understand and maintain.
* Support future business growth.
* Minimize unnecessary complexity.
* Keep business logic separated by domain.
* Allow new features to be introduced with minimal impact.
* Be deployable as a single application during Version 1.

---

# 3. High-Level Architecture

The platform consists of four primary parts:

* Customer Website
* Admin Panel
* Backend Application
* Database & File Storage

```
                    Customer
                       │
                       ▼
               Customer Website
                       │
                       ▼
                 Backend API
                ┌──────────────┐
                │ Business     │
                │ Modules      │
                └──────────────┘
                       │
                       ▼
            Database & File Storage

                       ▲

                Admin Panel
```

Version 1 will operate as a single backend application.

---

# 4. Primary User Interfaces

## Customer Website

Provides functionality for:

* Product browsing
* Product search
* Product details
* Bespoke questionnaire
* Shopping cart (guest local storage + authenticated cart)
* Checkout with Razorpay and flat shipping
* Order history
* Customer profile
* Reviews

---

## Admin Panel

Accessible through:

```
/admin
```

Provides functionality for:

* Product management
* Product image management
* Product variant management
* Inventory management
* Order management
* Basic customer management

---

# 5. Core Business Modules

The system is divided into logical business modules.

## Authentication

Responsible for:

* Customer WhatsApp OTP authentication
* Administrator email/password authentication (Supabase Auth)
* Session / token management

Development environments log OTP values instead of sending WhatsApp messages.

---

## Customer

Responsible for:

* Customer profile
* Saved addresses
* Basic customer lookup for administrators

---

## Product

Responsible for:

* Products
* Collections
* Variants
* Images
* Product status
* Inventory (stock per variant)

Inventory is owned by the Product module because stock is tracked on product variants. There is no separate Inventory module in Version 1.

---

## Bespoke

Responsible for:

* Serving the questionnaire experience
* Generating recommendations via the application scoring engine
* Persisting bespoke perfume results for authenticated customers
* Merging guest recommendations after login

Version 1 approach:

* Port the existing HTML prototype logic into application code (questions, weights, material pool, scoring, formula assembly).
* Do **not** store questionnaire configuration in the database.
* Persist only the generated perfume result and answer snapshot.
* Prefer running scoring in the backend (or a shared package used by the API) so stored formulas are authoritative.

---

## Cart

Responsible for:

* Cart management for authenticated customers
* Quantity updates
* Mixed cart support
* Merging guest cart data after login

A cart may contain:

* Ready-made perfumes
* Bespoke perfumes

simultaneously.

Guest carts are held in browser local storage until authentication.

---

## Orders

Responsible for:

* Order creation
* Order history
* Order status
* Purchased items
* Shipping charge capture
* Payment confirmation (Razorpay)

Order status is maintained manually by administrators. Version 1 does not support order cancellation.

---

## Payments

Responsible for:

* Creating Razorpay payment sessions
* Verifying payment webhooks / callbacks
* Linking successful payments to orders

---

## Reviews

Responsible for:

* Ratings
* Reviews
* Verified Buyer badge determination

Each logged-in customer may maintain one editable review per product. Reviews from customers who have purchased the product are marked as Verified Buyer.

---

## Media

Responsible for:

* Product images

Supports multiple images for each product.

Image ordering is managed by administrators.

---

# 6. Guest User Flow

Guests can:

* Browse products
* Search products
* View product details
* Complete the bespoke questionnaire
* Add items to cart (stored in browser local storage)

Guests cannot:

* Checkout
* Submit reviews
* Access customer account information

Authentication is required before completing restricted actions.

On login, the platform merges:

* Guest cart items into the customer cart
* Temporary bespoke recommendation into the customer account

---

# 7. Customer Flow

```
Browse Products

↓

View Product

↓

Add to Cart

↓

Login (if required)

↓

Checkout

↓

Pay via Razorpay

↓

Order Created
```

---

# 8. Bespoke Flow

```
Questionnaire

↓

Recommendation

↓

Customer may rename recommendation

↓

Add to Cart (₹1,000 / 100 ml)

↓

Login (if required) — merge guest result if needed

↓

Checkout (+ ₹50 flat shipping)

↓

Pay via Razorpay

↓

Order Created
```

Recommendations are stored for authenticated customers.

Guest recommendations remain in local storage until authentication, then merge into the customer account.

---

# 9. Order Lifecycle

Order progression for Version 1 (ready-made, bespoke, and mixed orders):

```
Order Received

↓

Confirmed

↓

In Production

↓

Ready for Dispatch

↓

Dispatched

↓

Delivered
```

Version 1 does not support cancelling orders.

The exact lifecycle may evolve as business requirements grow.

---

# 10. Product Lifecycle

Products support four statuses. Physical deletion is not part of the product workflow.

```
Draft  ←→  Active  ←→  Archived
  │          │            │
  └──────────┴────────────┴──→ Deleted
```

* **Draft** — Never released. Not customer-visible. Can be published to Active or soft-deleted.
* **Active** — Live in the catalog. Can return to Draft, move to Archived, or be soft-deleted.
* **Archived** — Taken down from sale. Kept in the database. Can return to Active or be soft-deleted.
* **Deleted** — Soft-removed. Row retained for historical reference; excluded from selling catalog.

Physical deletion is not part of Version 1.

---

# 11. Inventory Model

Inventory is maintained only for ready-made perfumes, as stock on each product variant within the Product module.

Example:

```
Noir

30ml → 12

50ml → 6

100ml → 2
```

Bespoke perfumes do not participate in inventory tracking.

---

# 12. Review Rules

Reviews require authentication.

A customer may:

* Create one review per product.
* Edit their existing review.

If the customer has purchased the product, the review displays a **Verified Buyer** badge.

Multiple reviews for the same product by the same customer are not supported.

---

# 13. Bespoke Perfumes

Bespoke perfumes are treated independently from the standard product catalog.

Characteristics:

* Created through the questionnaire scoring engine (ported from the existing prototype)
* Stored separately from catalog products
* Can be renamed by the customer
* Fixed V1 offer: ₹1,000 for 100 ml
* Not inventory managed
* Can be added to cart and ordered

What is stored:

* Editable display name
* Formula snapshot
* Answer snapshot
* Mood / explanation text
* Size and unit price

The generated formula itself is not editable by the customer.

Question/option CMS and deeper recommendation-engine work are deferred beyond Version 1.

---

# 14. Media Management

Products support:

* Multiple images
* Image ordering
* Thumbnail selection through ordering

Media storage implementation is documented separately.

---

# 15. Shipping and Payments

Version 1 rules:

* Flat shipping charge: **₹50** per order
* Payment provider: **Razorpay**
* Address-based shipping calculation is deferred

---

# 16. Future Expansion

The architecture should allow future addition of:

* Address-based shipping calculation
* Courier tracking
* Recommendation engine improvements / question CMS
* Notifications
* Coupons
* Wishlist
* Analytics
* Marketing tools
* Manufacturing workflow
* Order cancellation

These features should be added without major architectural restructuring.

---

# 17. V1 Tech Stack (Decided)

Version 1 uses the following stack. These choices are settled for implementation.

| Layer | Choice |
| ----- | ------ |
| Language | TypeScript (frontend and backend) |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js (App Router) + React |
| Styling | Tailwind CSS |
| Client data fetching | TanStack Query + thin fetch client in `web/lib` |
| Backend | NestJS (modular monolith) |
| API style | REST with global prefix `/api/v1` |
| Shared contracts | `packages/shared` (`@ishraqparfums/shared`) |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod for shared/request contracts (consistent across apps) |
| Customer auth | Custom WhatsApp OTP (OTP logged only in development) |
| Admin auth | Supabase Authentication (email and password) |
| Payments | Razorpay |
| File storage | Supabase Storage |
| Search (V1) | Database / PostgreSQL queries |
| Caching (V1) | None required initially (in-memory only if clearly justified) |

Architecture style: single deployable backend application (modular monolith) plus the Next.js customer/admin website.

Explicitly deferred for Version 1 (not part of the core stack):

* Redis
* Dedicated search engines
* GraphQL
* Microservices split

---

# 18. Open Decisions

The following decisions remain intentionally deferred:

* Production WhatsApp OTP provider details
* CDN
* Deployment platform (VPS, Railway, Coolify, or cloud provider)
* Exact monitoring / observability tooling

These decisions will be finalized during implementation.

---

# 19. Notes

This document focuses on overall system organization and the decided Version 1 tech stack.

Detailed database models, API contracts, request validation, endpoint design, repository folder layouts, and engineering conventions are documented separately in their respective documents.
