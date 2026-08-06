import type { ProductDetailVariant } from "@ishraqparfums/shared";

export function sortVariantsBySize(
  variants: ProductDetailVariant[],
): ProductDetailVariant[] {
  return [...variants].sort((a, b) => a.sizeMl - b.sizeMl);
}

/** Prefer first in-stock sellable size; otherwise the first size (CTA disabled). */
export function pickDefaultVariant(
  variants: ProductDetailVariant[],
): ProductDetailVariant | null {
  const ordered = sortVariantsBySize(variants);
  if (ordered.length === 0) return null;
  return (
    ordered.find((v) => v.isAvailable && v.stockQty > 0) ?? ordered[0] ?? null
  );
}

export function isVariantSellable(variant: ProductDetailVariant): boolean {
  return variant.isAvailable && variant.stockQty > 0;
}
