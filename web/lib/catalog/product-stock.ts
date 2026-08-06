import type { ProductDetailVariant } from "@ishraqparfums/shared";
import { isVariantSellable } from "@/lib/catalog/product-variants";

/**
 * Per-selected-variant stock copy for the PDP.
 * Unsellable → unavailable; ≤10 → exact count; 11–19 → soft urgency; ≥20 → quiet.
 */
export function stockLabel(variant: ProductDetailVariant | null): string | null {
  if (!variant || !isVariantSellable(variant)) {
    return "Currently unavailable";
  }
  if (variant.stockQty <= 10) {
    return `Only ${variant.stockQty} left`;
  }
  if (variant.stockQty <= 19) {
    return "Few left";
  }
  return null;
}
