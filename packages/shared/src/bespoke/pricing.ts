/** Default ₹10/ml → 100 ml = ₹1,000. Override via API env for commerce. */
export const BESPOKE_PAISE_PER_ML = 1000;

/** Allowed bottle sizes in ml (modifiable; FE + API should stay in sync). */
export const BESPOKE_ALLOWED_SIZES_ML: readonly number[] = [30, 50, 100];

/** Max bottles of one size on a single cart line. */
export const BESPOKE_MAX_LINE_QUANTITY = 10;

export function isAllowedBespokeSize(sizeMl: number): boolean {
  return BESPOKE_ALLOWED_SIZES_ML.includes(sizeMl);
}

export function assertAllowedBespokeSize(sizeMl: number): void {
  if (!Number.isInteger(sizeMl) || !isAllowedBespokeSize(sizeMl)) {
    throw new Error(
      `Invalid bespoke size ${sizeMl}ml. Allowed: ${BESPOKE_ALLOWED_SIZES_ML.join(', ')}`,
    );
  }
}

export function clampBespokeLineQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(BESPOKE_MAX_LINE_QUANTITY, Math.max(0, Math.trunc(quantity)));
}

export function pricePaiseForSize(
  sizeMl: number,
  paisePerMl: number = BESPOKE_PAISE_PER_ML,
): number {
  assertAllowedBespokeSize(sizeMl);
  return sizeMl * paisePerMl;
}
