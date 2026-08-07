import type { ProductVariant } from '@prisma/client';

/**
 * Free units that can still be sold (on-hand minus reserved).
 */
export function availableQty(
  variant: Pick<ProductVariant, 'stockQty' | 'reservedQty'>,
): number {
  return Math.max(0, variant.stockQty - variant.reservedQty);
}

/**
 * Size is flagged for sale on the shelf (stock may still be zero).
 */
export function isVariantOnShelf(
  variant: Pick<ProductVariant, 'isAvailable'>,
): boolean {
  return variant.isAvailable;
}

/**
 * Variant can be purchased: flagged available and has free stock.
 */
export function isVariantSellable(
  variant: Pick<ProductVariant, 'isAvailable' | 'stockQty' | 'reservedQty'>,
): boolean {
  return variant.isAvailable && availableQty(variant) > 0;
}

function cheapestByPrice<T extends Pick<ProductVariant, 'pricePaise'>>(
  variants: T[],
): T | null {
  if (variants.length === 0) return null;
  return variants.reduce((cheapest, variant) =>
    variant.pricePaise < cheapest.pricePaise ? variant : cheapest,
  );
}

/**
 * Cheapest sellable variant — preferred "from" price when in stock.
 */
export function findCheapestSellableVariant<
  T extends Pick<
    ProductVariant,
    'pricePaise' | 'isAvailable' | 'stockQty' | 'reservedQty'
  >,
>(variants: T[]): T | null {
  return cheapestByPrice(variants.filter(isVariantSellable));
}

/**
 * Cheapest size still on the shelf (may be sold out) — list price fallback.
 */
export function findCheapestOnShelfVariant<
  T extends Pick<ProductVariant, 'pricePaise' | 'isAvailable'>,
>(variants: T[]): T | null {
  return cheapestByPrice(variants.filter(isVariantOnShelf));
}

/**
 * Absolute cheapest size — last-resort display price.
 */
export function findCheapestVariant<
  T extends Pick<ProductVariant, 'pricePaise'>,
>(variants: T[]): T | null {
  return cheapestByPrice(variants);
}

/**
 * Display "from" price: sellable → on-shelf → any size.
 */
export function findCheapestDisplayVariant<
  T extends Pick<
    ProductVariant,
    'pricePaise' | 'isAvailable' | 'stockQty' | 'reservedQty'
  >,
>(variants: T[]): T | null {
  return (
    findCheapestSellableVariant(variants) ??
    findCheapestOnShelfVariant(variants) ??
    findCheapestVariant(variants)
  );
}
