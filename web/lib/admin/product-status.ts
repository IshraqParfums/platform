import {
  legalNextAdminProductStatuses,
  type ProductStatus,
} from "@ishraqparfums/shared";

export const ADMIN_PRODUCT_STATUSES: ProductStatus[] = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
  "DELETED",
];

export function adminProductStatusLabel(status: ProductStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "ACTIVE":
      return "Active";
    case "ARCHIVED":
      return "Archived";
    case "DELETED":
      return "Deleted";
  }
}

/** Short copy for status cards and confirm modals. */
export function adminProductStatusHelp(status: ProductStatus): string {
  switch (status) {
    case "DRAFT":
      return "Not visible in the shop. Finish details, sizes, and photos, then activate to go live.";
    case "ACTIVE":
      return "Live in the shop when at least one size is on the shelf (sold-out still shows). To hide it from browse, make all sizes unavailable — or delete it.";
    case "ARCHIVED":
      return "Archived because its collection was archived. Restore that collection, move this product to an active collection, or delete it.";
    case "DELETED":
      return "Terminal and read-only. Soft-deleted from normal admin lists — filter for deleted products if you need to look it up.";
  }
}

/**
 * Statuses an admin may transition to from the current status.
 * Sourced from shared ADMIN_PRODUCT_STATUS_TRANSITIONS.
 */
export function legalNextProductStatuses(
  status: ProductStatus,
): ProductStatus[] {
  return [...legalNextAdminProductStatuses(status)];
}
