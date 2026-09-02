import { discountPercentFromRatio } from "@/lib/format/money";

/**
 * Selling price vs compare-at (MRP) helpers for admin variant forms/tables.
 * Discount % = (compareAt − price) / compareAt × 100 when compareAt > price.
 */

/** Highest allowed “% off” in admin (exclusive of 100% / free). */
export const MAX_DISCOUNT_PERCENT = 99;

export function clampDiscountPercent(n: number): number {
  return Math.min(MAX_DISCOUNT_PERCENT, Math.max(0, Math.round(n)));
}

export function isValidDiscountPercent(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= MAX_DISCOUNT_PERCENT;
}

export function discountPercentFromPrices(
  priceRupees: number,
  compareAtRupees: number,
): number | null {
  if (compareAtRupees <= 0 || compareAtRupees < priceRupees) return null;
  if (compareAtRupees === priceRupees) return 0;
  return discountPercentFromRatio(priceRupees, compareAtRupees);
}

export function compareAtFromDiscountPercent(
  priceRupees: number,
  discountPercent: number,
): number | null {
  if (priceRupees < 0 || !isValidDiscountPercent(discountPercent)) {
    return null;
  }
  if (discountPercent === 0) return priceRupees;
  return Math.round(priceRupees / (1 - discountPercent / 100));
}

export function formatDiscountOff(percent: number | null): string {
  if (percent == null || percent <= 0) return "—";
  return `${percent}% off`;
}

export const COMPARE_AT_MARKUPS = [0.05, 0.1, 0.15, 0.2] as const;

export function suggestedCompareAt(priceRupees: number): number {
  const markup =
    COMPARE_AT_MARKUPS[Math.floor(Math.random() * COMPARE_AT_MARKUPS.length)]!;
  return Math.round(priceRupees * (1 + markup));
}

export function parseWholeRupees(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

/**
 * Whole non-negative integer from a string field (stock, counts).
 * Empty / non-digit input → null (unlike Number("") === 0).
 */
export function parseWholeNonNegativeInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

/** Parses a whole-number percent in 0…MAX_DISCOUNT_PERCENT. */
export function parseWholePercent(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  if (!isValidDiscountPercent(n)) return null;
  return n;
}
