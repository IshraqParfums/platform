import type { ProductStatus } from "./admin-product-contracts.js";

/**
 * Admin-initiated product status transitions (single source of truth).
 *
 * ARCHIVED is created by system (collection cascade / park path), not by
 * admin PATCH. From ARCHIVED, admin may only soft-delete.
 * ACTIVE cannot return to DRAFT — shelf-off is variant-level.
 */
export const ADMIN_PRODUCT_STATUS_TRANSITIONS: Record<
  ProductStatus,
  readonly ProductStatus[]
> = {
  DRAFT: ["ACTIVE", "DELETED"],
  ACTIVE: ["DELETED"],
  ARCHIVED: ["DELETED"],
  DELETED: [],
};

export function legalNextAdminProductStatuses(
  status: ProductStatus,
): readonly ProductStatus[] {
  return ADMIN_PRODUCT_STATUS_TRANSITIONS[status];
}

export function isValidAdminProductStatusTransition(
  from: ProductStatus,
  to: ProductStatus,
): boolean {
  if (from === to) return true;
  return ADMIN_PRODUCT_STATUS_TRANSITIONS[from].includes(to);
}
