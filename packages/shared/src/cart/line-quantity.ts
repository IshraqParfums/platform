/**
 * Per-order ceiling for a single catalog cart line.
 *
 * Deliberately separate from `BESPOKE_MAX_LINE_QUANTITY` even though both are
 * 10 today: a bespoke brew has no stock row, so its cap is the only bound
 * that exists, whereas this one sits *alongside* free stock to keep one order
 * from draining a small-batch variant. The two policies can move apart.
 */
export const MAX_CATALOG_LINE_QUANTITY = 10;

/**
 * Effective ceiling for a variant — the cap, or free stock when that is
 * scarcer. Callers that know the stock should always prefer this over the
 * bare constant so the two bounds can never drift apart at a call site.
 */
export function maxCatalogLineQuantity(availableQty: number): number {
  if (!Number.isFinite(availableQty)) return 0;
  return Math.min(MAX_CATALOG_LINE_QUANTITY, Math.max(0, availableQty));
}

/** Clamp a requested quantity into `[0, min(cap, stock)]`. */
export function clampCatalogLineQuantity(
  quantity: number,
  availableQty: number,
): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(
    maxCatalogLineQuantity(availableQty),
    Math.max(0, Math.trunc(quantity)),
  );
}
