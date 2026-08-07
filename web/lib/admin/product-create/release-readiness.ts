import { isValidSlug } from "@/lib/admin/slugify";
import { assessCreateSizes } from "@/lib/admin/product-create/size-draft";
import type { CreateSizeDraftMap } from "@/lib/admin/product-create/size-draft";

export type ProductCreateReleaseBlockerId =
  | "details"
  | "sellable_size"
  | "image";

export type ProductCreateReleaseBlocker = {
  id: ProductCreateReleaseBlockerId;
  label: string;
};

export type ProductCreateReadinessInput = {
  name: string;
  slug: string;
  collectionId: string;
  collectionArchived: boolean;
  shortDescription: string;
  detailedDescription: string;
  sizes: CreateSizeDraftMap;
  imageCount: number;
};

export function hasValidCreateDetails(input: {
  name: string;
  slug: string;
  collectionId: string;
  shortDescription: string;
  detailedDescription: string;
}): boolean {
  return (
    Boolean(input.name.trim()) &&
    Boolean(input.shortDescription.trim()) &&
    Boolean(input.detailedDescription.trim()) &&
    Boolean(input.collectionId) &&
    isValidSlug(input.slug)
  );
}

/**
 * Unmet conditions for Create & release.
 * Archived collection is a warning only — not a blocker (parked as COLLECTION archive).
 * Incomplete enabled sizes are ignored; only complete sellable sizes count.
 */
export function getProductCreateReleaseBlockers(
  input: ProductCreateReadinessInput,
): ProductCreateReleaseBlocker[] {
  const blockers: ProductCreateReleaseBlocker[] = [];
  const sizes = assessCreateSizes(input.sizes);

  if (!hasValidCreateDetails(input)) {
    blockers.push({
      id: "details",
      label: "Fill name, slug, collection, and both descriptions",
    });
  }

  if (!sizes.hasSellableVariant) {
    blockers.push({
      id: "sellable_size",
      label: "Select at least one size with price ≥ ₹1 and stock > 0",
    });
  }

  if (input.imageCount < 1) {
    blockers.push({
      id: "image",
      label: "Add at least one product image",
    });
  }

  return blockers;
}

/** Draft only needs details — incomplete size pills are skipped on submit. */
export function getProductCreateDraftBlockers(
  input: Pick<
    ProductCreateReadinessInput,
    | "name"
    | "slug"
    | "collectionId"
    | "shortDescription"
    | "detailedDescription"
  >,
): ProductCreateReleaseBlocker[] {
  if (hasValidCreateDetails(input)) return [];
  return [
    {
      id: "details",
      label: "Fill name, slug, collection, and both descriptions",
    },
  ];
}

export function canSaveProductDraft(
  input: Pick<
    ProductCreateReadinessInput,
    | "name"
    | "slug"
    | "collectionId"
    | "shortDescription"
    | "detailedDescription"
  >,
): boolean {
  return getProductCreateDraftBlockers(input).length === 0;
}

export function canReleaseProductCreate(
  input: ProductCreateReadinessInput,
): boolean {
  return getProductCreateReleaseBlockers(input).length === 0;
}
