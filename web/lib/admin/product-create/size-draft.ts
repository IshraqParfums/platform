import {
  MAX_DISCOUNT_PERCENT,
  parseWholeNonNegativeInt,
  parseWholePercent,
  parseWholeRupees,
} from "@/lib/admin/variant-pricing";
import type { CatalogSizeMl } from "@/lib/admin/product-create/catalog-sizes";
import { CATALOG_SIZE_OPTIONS_ML } from "@/lib/admin/product-create/catalog-sizes";

export type CreateSizeDraft = {
  enabled: boolean;
  priceRupees: string;
  compareAtRupees: string;
  discountPercent: string;
  compareTouched: boolean;
  stockQty: string;
};

export type CreateSizeDraftMap = Record<CatalogSizeMl, CreateSizeDraft>;

export type ParsedCreateVariant = {
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQty: number;
};

export type ParseCreateSizesResult =
  | { ok: true; variants: ParsedCreateVariant[] }
  | { ok: false; error: string };

/**
 * Assessment for gates. Submit uses `collectCompleteCreateSizeDrafts` so
 * empty/half-filled enabled pills are skipped (draft + release).
 */
export type CreateSizesAssessment = {
  /** Fully valid enabled sizes only. */
  completeVariants: ParsedCreateVariant[];
  /** At least one complete variant with stock > 0. */
  hasSellableVariant: boolean;
};

export function emptyCreateSizeDraft(): CreateSizeDraft {
  return {
    enabled: false,
    priceRupees: "",
    compareAtRupees: "",
    discountPercent: "",
    compareTouched: false,
    stockQty: "0",
  };
}

export function emptyCreateSizeDraftMap(): CreateSizeDraftMap {
  return {
    30: emptyCreateSizeDraft(),
    50: emptyCreateSizeDraft(),
    100: emptyCreateSizeDraft(),
  };
}

export function enabledCatalogSizes(
  sizes: CreateSizeDraftMap,
): CatalogSizeMl[] {
  return CATALOG_SIZE_OPTIONS_ML.filter((sizeMl) => sizes[sizeMl].enabled);
}

/**
 * Parse one enabled size. Returns null if incomplete/invalid (skip for draft).
 */
export function tryParseCreateSizeDraft(
  sizeMl: CatalogSizeMl,
  draft: CreateSizeDraft,
): ParsedCreateVariant | null {
  if (!draft.enabled) return null;

  const priceRupees = parseWholeRupees(draft.priceRupees);
  if (priceRupees == null || priceRupees < 1) return null;

  if (draft.discountPercent.trim()) {
    const pct = parseWholePercent(draft.discountPercent);
    if (pct == null) return null;
  }

  let compareAtRupees: number | null = null;
  if (draft.compareAtRupees.trim()) {
    compareAtRupees = parseWholeRupees(draft.compareAtRupees);
    if (compareAtRupees == null || compareAtRupees < 1) return null;
    if (compareAtRupees < priceRupees) return null;
  }

  const stockQty = parseWholeNonNegativeInt(draft.stockQty);
  if (stockQty == null) return null;

  return {
    sizeMl,
    pricePaise: priceRupees * 100,
    compareAtPricePaise:
      compareAtRupees != null ? compareAtRupees * 100 : null,
    stockQty,
  };
}

/**
 * Enabled sizes that fully parse — incomplete pills are ignored.
 * Used for both draft and release submits.
 */
export function collectCompleteCreateSizeDrafts(
  sizes: CreateSizeDraftMap,
): ParsedCreateVariant[] {
  const variants: ParsedCreateVariant[] = [];
  for (const sizeMl of enabledCatalogSizes(sizes)) {
    const parsed = tryParseCreateSizeDraft(sizeMl, sizes[sizeMl]);
    if (parsed) variants.push(parsed);
  }
  return variants;
}

/**
 * Strict: every enabled size must parse, or fail with the first error.
 * Kept for callers that want fail-fast validation.
 */
export function parseCreateSizeDrafts(
  sizes: CreateSizeDraftMap,
): ParseCreateSizesResult {
  const variants: ParsedCreateVariant[] = [];

  for (const sizeMl of enabledCatalogSizes(sizes)) {
    const draft = sizes[sizeMl];
    const priceRupees = parseWholeRupees(draft.priceRupees);
    if (priceRupees == null || priceRupees < 1) {
      return {
        ok: false,
        error: `${sizeMl} ml: selling price must be a whole number of rupees ≥ 1`,
      };
    }

    if (draft.discountPercent.trim()) {
      const pct = parseWholePercent(draft.discountPercent);
      if (pct == null) {
        return {
          ok: false,
          error: `${sizeMl} ml: discount must be a whole number from 0 to ${MAX_DISCOUNT_PERCENT}`,
        };
      }
    }

    let compareAtRupees: number | null = null;
    if (draft.compareAtRupees.trim()) {
      compareAtRupees = parseWholeRupees(draft.compareAtRupees);
      if (compareAtRupees == null || compareAtRupees < 1) {
        return {
          ok: false,
          error: `${sizeMl} ml: compare-at price must be a whole number of rupees ≥ 1`,
        };
      }
      if (compareAtRupees < priceRupees) {
        return {
          ok: false,
          error: `${sizeMl} ml: compare-at price cannot be less than the selling price`,
        };
      }
    }

    const stockQty = parseWholeNonNegativeInt(draft.stockQty);
    if (stockQty == null) {
      return {
        ok: false,
        error: `${sizeMl} ml: stock must be a whole number ≥ 0`,
      };
    }

    variants.push({
      sizeMl,
      pricePaise: priceRupees * 100,
      compareAtPricePaise:
        compareAtRupees != null ? compareAtRupees * 100 : null,
      stockQty,
    });
  }

  return { ok: true, variants };
}

export function assessCreateSizes(
  sizes: CreateSizeDraftMap,
): CreateSizesAssessment {
  const completeVariants = collectCompleteCreateSizeDrafts(sizes);
  return {
    completeVariants,
    hasSellableVariant: completeVariants.some((variant) => variant.stockQty > 0),
  };
}
