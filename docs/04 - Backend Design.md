# 04 - Backend Design

**Project:** Ishraq Parfums
**Document Version:** 1.0
**Status:** Draft (Version 1 / MVP)

---

# 1. Purpose

This document defines the internal backend architecture of the Ishraq Parfums platform.

It describes:

* Module organization
* Responsibilities
* Request flow
* Business layer separation
* Authorization
* Background processing
* Error handling
* Integration boundaries

This document does not define the database schema or API contracts.

---

# 2. Backend Design Principles

The backend should:

* Follow a modular monolith architecture.
* Organize code by business domains rather than technical layers.
* Keep modules independent wherever practical.
* Separate business logic from infrastructure.
* Keep controllers lightweight.
* Keep services focused on business rules.
* Make future feature additions straightforward without major restructuring.

---

# 3. Module Structure

The backend is organized into the following business modules.

Physical source layout under `api/src/modules/` (and Nest `common/`) is specified in Engineering Standards. This section defines module responsibilities only.

## Authentication

Responsibilities:

* Customer WhatsApp OTP authentication
* Administrator email/password authentication via Supabase Auth
* Token / session management

In development, OTP values are logged and not sent via WhatsApp.

---

## Customer

Responsibilities:

* Customer profile
* Saved addresses
* Account management
* Basic customer listing for administrators

---

## Product

Responsibilities:

* Product management
* Collections
* Variants
* Product images
* Inventory (stock quantity on variants)

Inventory belongs here because stock is a property of product variants.

---

## Bespoke

Responsibilities:

* Serving the questionnaire UI flow
* Running the code-based scoring / formula engine
* Persisting bespoke perfume results
* Merging guest recommendations after login

Version 1 implementation notes:

* Port the existing HTML prototype (`Find_Your_Bespoke_Blend`) logic into the Bespoke module / shared package.
* Keep questions, weights, materials, and scoring in code — not admin-editable database config.
* Accept submitted answers, compute the recommendation server-side (preferred), and persist name, formula snapshot, answer snapshot, mood/explanation, size, and price.
* Customer may rename the perfume; they may not edit the formula.

Version 1 does not include admin editing of questions or algorithm weights.

---

## Cart

Responsibilities:

* Cart creation for authenticated customers
* Cart updates
* Mixed cart support
* Cart validation
* Merge of guest local-storage cart on login

---

## Orders

Responsibilities:

* Order creation after successful payment
* Order history
* Order status management
* Flat shipping amount capture (₹50)

Version 1 does not support order cancellation.

---

## Payments

Responsibilities:

* Razorpay order / payment session creation
* Payment verification
* Webhook handling
* Linking payments to orders

---

## Reviews

Responsibilities:

* Rating management
* Review management
* Verified Buyer badge determination based on purchase history

---

## Admin

Responsibilities:

* Product administration
* Inventory administration
* Order administration
* Basic customer management

Admin authentication is provided by Supabase Auth; the Admin module enforces administrator-only operations.

---

## Media

Responsibilities:

* Image upload
* Image ordering
* Image metadata

---

## Shared

Contains reusable Nest-local helpers shared across API modules such as:

* Constants
* Utilities
* Common validation helpers
* Common exceptions / filters

Shared Nest code must not contain business logic.

Cross-app TypeScript contracts belong in `packages/shared`, not in the Nest Shared folder.

Physical `api/` / `web/` / `packages/shared/` folder layouts are defined in **Engineering Standards**.

---

# 4. Layered Architecture

Each module follows a layered structure.

```text
Client
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Database
```

Responsibilities:

### Controller

* Receive requests
* Validate input
* Invoke services
* Return responses

Controllers should contain minimal business logic.

---

### Service

Responsible for business rules.

Examples:

* Create product
* Generate bespoke perfume
* Create order after payment verification
* Validate stock
* Submit review / determine Verified Buyer
* Merge guest cart on login

---

### Repository

Responsible for data access only.

Repositories should not contain business rules.

---

# 5. Request Flow

Example product purchase:

```text
Client

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Controller

↓

Response
```

---

# 6. Authentication Flow

## Customer (WhatsApp OTP)

```text
Client

↓

Authentication Controller

↓

Authentication Service

↓

Generate OTP

↓

Send via WhatsApp (production) / Log OTP (development)

↓

Verify OTP

↓

Token Generation

↓

Merge guest cart + bespoke recommendation from client payload

↓

Response
```

## Administrator (Supabase email/password)

```text
Client

↓

Admin Authentication (Supabase Auth)

↓

Backend verifies admin session / JWT

↓

Authorized admin operations
```

Authorization is enforced before protected operations.

---

# 7. Authorization

Protected operations require authentication.

Examples include:

* Checkout
* Writing reviews
* Viewing customer history
* Managing products
* Managing orders
* Viewing customer records (admin)

Administrative operations require administrator privileges via Supabase Auth.

---

# 8. Business Rules

Business rules reside exclusively within services.

Examples:

* One review per customer per product.
* Verified Buyer badge when the reviewer has purchased the product.
* Product variants must belong to a product.
* Bespoke perfumes do not participate in inventory.
* Guest users cannot complete checkout.
* Mixed carts are supported.
* Bespoke V1 price is ₹1,000 for 100 ml.
* Flat shipping is ₹50 per order.
* Archived products cannot return to Draft or Active.
* Orders cannot be cancelled in Version 1.

Repositories and controllers must not enforce business rules beyond basic validation.

---

# 9. Validation

Validation occurs in two stages.

## Request Validation

Performed before business logic executes.

Examples:

* Required fields
* Data types
* Value ranges
* Input formats

---

## Business Validation

Performed within services.

Examples:

* Product availability
* Review ownership
* Inventory checks
* Order eligibility
* Payment verification

---

# 10. Error Handling

Errors should be categorized consistently.

Examples:

* Validation errors
* Authentication errors
* Authorization errors
* Business rule violations
* Resource not found
* Payment failures
* Internal server errors

Business errors should provide meaningful responses without exposing internal implementation details.

---

# 11. Transactions

Database transactions should be used when multiple related operations must succeed together.

Typical examples include:

* Creating an order and its order items after payment confirmation.
* Updating inventory during order creation.
* Creating a review and updating product aggregates (if applicable).
* Merging guest cart items into the customer cart on login.

Simple read operations should not use transactions.

---

# 12. Background Processing

Long-running or non-blocking tasks should execute asynchronously.

Examples include:

* Sending WhatsApp OTP messages.
* Image processing.
* Notification delivery.
* Razorpay webhook side effects when appropriate.

These tasks should not delay the user-facing request.

---

# 13. File Handling

The backend stores only file metadata.

Typical workflow:

```text
Client

↓

Upload Image

↓

External Storage

↓

Store Metadata

↓

Return Success
```

Image binaries are never stored directly in the relational database.

---

# 14. Payments (Razorpay)

Typical checkout payment flow:

```text
Client

↓

Create Order Intent

↓

Create Razorpay Payment Session

↓

Customer Completes Payment

↓

Verify Payment (callback / webhook)

↓

Finalize Order + Decrement Ready-Made Inventory
```

Orders should only be treated as successfully placed after payment verification.

---

# 15. Module Communication

Modules communicate through service interfaces.

Example:

```text
Order Service

↓

Product Service

↓

Inventory Validation
```

Modules should not directly access another module's repositories.

This keeps responsibilities well defined and reduces coupling.

---

# 16. Extensibility

The architecture should support future additions including:

* Address-based shipping calculation
* Shipping / courier integration
* Notifications
* Coupons
* Wishlist
* Questionnaire CMS / recommendation improvements
* Order cancellation

These additions should integrate through new modules or well-defined service interfaces rather than modifying unrelated modules.

---

# 17. Open Decisions

Settled for Version 1 (see System Design): NestJS, Prisma, PostgreSQL, REST `/api/v1`, Razorpay, Supabase Storage.

The following implementation details remain intentionally deferred:

* Background job implementation details.
* Event-driven communication (if introduced later).
* Logging library / transport details.
* Monitoring and observability tooling.
* Production WhatsApp OTP provider details.

These decisions will be finalized during implementation.

---

# 18. Summary

The backend follows a modular monolith architecture where each business capability owns its own responsibilities, business rules, and data access.

The design emphasizes clear module boundaries, lightweight controllers, service-centric business logic, repository-based data access, and extensibility without unnecessary complexity.
