# 01 - Functional Specification

**Project:** Ishraq Parfums
**Document Version:** 1.0
**Status:** Draft (Version 1 / MVP)

---

# 1. Introduction

## 1.1 Purpose

This document defines the functional requirements for Version 1 (MVP) of the Ishraq Parfums platform.

It describes what the platform should do from a business and user perspective. It intentionally avoids implementation details, technology choices, and architectural decisions, which are covered in separate technical documents.

---

## 1.2 Vision

Ishraq Parfums aims to provide customers with a premium online perfume shopping experience by offering:

* Curated ready-made perfumes
* Personalized bespoke perfumes created through a guided questionnaire

The platform should provide a smooth shopping experience while remaining flexible enough to support future business growth.

---

## 1.3 Objectives

Version 1 aims to:

* Sell ready-made perfumes online
* Offer personalized perfume recommendations through a questionnaire
* Allow customers to order bespoke perfumes
* Provide a clean and intuitive shopping experience
* Enable administrators to manage products, inventory, and orders efficiently
* Establish a scalable foundation for future enhancements

---

# 2. Scope

## Included in Version 1

* Customer authentication using WhatsApp OTP
* Admin authentication using email and password
* Browse ready-made perfumes
* Search products
* Browse collections
* View product details
* Complete bespoke questionnaire
* Receive personalized recommendation
* Shopping cart (including guest local storage + merge on login)
* Checkout with flat ₹50 shipping
* Payment via Razorpay
* Order placement
* Order history
* Product reviews and ratings (Verified Buyer badge for purchasers)
* Customer profile
* Admin product management
* Basic inventory management
* Order management
* Basic customer management (admin)

---

## Out of Scope

The following features are intentionally excluded from Version 1.

* Coupon system
* Loyalty programs
* Subscription plans
* Multiple warehouses
* Manufacturing workflow automation
* Marketing campaigns
* Multi-language support
* Multi-currency support
* Courier integrations
* Live shipment tracking
* Advanced analytics
* Address-based shipping rate calculation
* Order cancellation
* Admin-managed questionnaire / recommendation CMS
* Recommendation engine enhancements

These features may be introduced in future versions.

---

# 3. User Roles

## 3.1 Customer

A customer can:

* Authenticate using OTP
* Browse products
* Search products
* Browse collections
* View product details
* Complete the bespoke questionnaire
* View personalized recommendations
* Rename a recommended bespoke perfume
* Add products to cart
* Place orders
* View order history
* View current order status
* Manage profile
* Submit ratings and reviews

---

## 3.2 Administrator

An administrator can:

* Login (email and password)
* Add products
* Edit products
* Manage product variants
* Upload product images
* Manage inventory
* View and manage basic customer information
* View customer orders
* Update order status

Version 1 supports a single administrator role.

---

# 4. Product Collections

Version 1 includes the following collections.

* Designer
* Nostalgia

The platform should allow additional collections to be introduced in future versions.

---

# 5. Products

Each product should support the following information.

* Product Name
* Collection
* Short Description
* Detailed Description
* Multiple Product Images
* Available Bottle Sizes
* Pricing
* Stock Availability
* Product Rating
* Customer Reviews
* Product Status (Draft / Active / Archived)

Each product may support one or more bottle sizes.

Examples include:

* 10 ml
* 30 ml
* 50 ml
* 100 ml

Administrators should be able to select which predefined bottle sizes are available for a product.

Product lifecycle:

* **Draft** — Not visible to customers. Can be edited and later published as Active.
* **Active** — Visible and available for purchase. Can be returned to Draft if needed.
* **Archived** — Permanently removed from the catalog. Retained for historical order records only and cannot be restored to Draft or Active.

---

# 6. Homepage

The homepage serves as the primary entry point to the platform.

Its purpose is to introduce the brand, highlight featured products, showcase perfume collections, and promote the bespoke perfume experience.

The exact layout and visual presentation are outside the scope of this document.

---

# 7. Product Listing

Customers should be able to:

* Browse all products
* Search products
* Browse products by collection
* Open product details

Version 1 supports searching by:

* Product Name
* Collection

Additional searchable attributes may be introduced later.

---

# 8. Product Details

Each product page should display:

* Product Name
* Collection
* Product Description
* Available Bottle Sizes
* Price
* Stock Availability
* Multiple Product Images
* Average Rating
* Customer Reviews
* Add to Cart option

---

# 9. Bespoke Perfume Experience

The bespoke perfume experience is one of the primary features of the platform.

Customers complete a guided questionnaire designed to understand their fragrance preferences.

After completing the questionnaire, customers receive a personalized perfume recommendation they can rename, add to cart, and purchase.

The recommendation experience includes:

* Personalized Perfume Name (customer may rename)
* Fragrance Personality / Mood
* Formula Summary (top, heart, base)
* Brief explanation of why it fits them

**V1 pricing:** Bespoke perfume is sold as a fixed offering at **₹1,000 for 100 ml**. Pricing and size options may evolve in later versions.

**V1 questionnaire approach:** Adopt the existing interactive prototype as the product engine:

* Questions, axis weights, material pool, and scoring/formula logic ship as **application code** (not database-configured).
* Flow mirrors the prototype: a fixed Phase 1 question set, then a short adaptive Phase 2 based on leading preferences.
* Persist only the **generated result** (name, formula, mood/explanation) plus an **answer snapshot**.
* No admin UI or CMS to edit questions/algorithm in Version 1.
* Guests may complete the questionnaire; results stay in local storage until login, then merge into the customer account.

Deep recommendation-engine work, question CMS, and algorithm experimentation are deferred beyond Version 1.

---

# 10. Shopping Cart

Customers should be able to:

* Add products to cart
* Remove products
* Update quantities
* View cart summary

The shopping cart should support both ready-made perfumes and bespoke perfumes simultaneously.

Guests may maintain a cart locally (for example in browser storage). On login, the guest cart and any temporary bespoke recommendation are merged into the authenticated customer account.

---

# 11. Checkout

Customers should be able to:

* Review cart
* Enter or select shipping address
* Review shipping charge
* Complete payment via Razorpay
* Place an order

**V1 shipping:** A flat shipping charge of **₹50** applies to all orders. Address-based shipping calculation may be introduced in future versions without changing the overall checkout experience.

**V1 payment:** Payment is in scope and processed through **Razorpay**.

---

# 12. Authentication

## Customers

Customers authenticate using OTP verification sent via **WhatsApp**.

The authentication process should provide a simple and secure login experience.

In development environments, OTP values are logged by the system and are not sent via WhatsApp.

## Administrators

Administrators authenticate using email and password (Supabase Authentication).

Implementation details are covered separately in the technical documentation.

---

# 13. Orders

Customers should be able to:

* Place orders
* View order history
* View purchased items
* View shipping information
* View payment summary
* View the current order status

Order status is updated manually by administrators.

Order statuses for Version 1:

* Order Received
* Confirmed
* In Production
* Ready for Dispatch
* Dispatched
* Delivered

The same status path applies to ready-made, bespoke, and mixed orders.

Version 1 does **not** support order cancellation by customers or administrators.

Future versions may integrate courier tracking services.

---

# 14. Inventory

Version 1 includes basic inventory management.

Inventory should reflect the available stock for each product variant.

Administrators should be able to update inventory whenever required.

---

# 15. Reviews and Ratings

Any logged-in customer may:

* Submit a rating and review for a product
* Edit their existing review
* View product ratings and customer reviews

Rules for Version 1:

* One review per customer per product.
* Reviews from customers who have purchased the product display a **Verified Buyer** badge.
* Review moderation is outside the scope of Version 1.

---

# 16. Customer Profile

Customers should be able to manage:

* Personal information
* Saved addresses
* Order history

---

# 17. Contact

The platform should provide customers with the necessary contact information to communicate with Ishraq Parfums.

The exact communication channels may evolve over time.

---

# 18. Legal Pages

The platform should include:

* Privacy Policy
* Terms and Conditions

Additional legal pages may be introduced as required.

---

# 19. Future Enhancements

Potential future improvements include:

* Hero animations
* Wishlist
* Coupon system
* Shipping integrations
* Courier tracking
* Address-based shipping calculation
* Additional bespoke sizes and pricing rules
* Recommendation history and engine improvements
* Manufacturing dashboard
* Analytics dashboard
* Marketing tools
* Customer notifications
* Order cancellation flows

---

# 20. Success Criteria

Version 1 will be considered functionally complete when customers can:

* Authenticate via WhatsApp OTP
* Browse products
* Search products
* View product details
* Complete the bespoke questionnaire
* Receive a personalized recommendation
* Add ready-made and bespoke products to cart
* Complete checkout with flat ₹50 shipping
* Pay via Razorpay
* Place orders
* View order history
* View current order status
* Submit product reviews and ratings (with Verified Buyer badge when applicable)

Administrators should be able to:

* Login with email and password
* Add products
* Edit products
* Manage product variants and lifecycle (Draft / Active / Archived)
* Upload product images
* Manage inventory
* View basic customer information
* Manage customer orders
* Update order status

---

# 21. Notes

This document defines the functional behavior of the platform only.

Technical architecture, database design, APIs, authentication implementation, deployment strategy, coding standards, and technology choices are documented separately.
