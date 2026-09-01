/** India mobile in E.164 — extend later for other countries. */
export const INDIAN_MOBILE_E164_PATTERN = String.raw`^\+91[6-9]\d{9}$`;

export const INDIAN_MOBILE_E164_RE = new RegExp(INDIAN_MOBILE_E164_PATTERN);

export function isIndianMobileE164(value: string): boolean {
  return INDIAN_MOBILE_E164_RE.test(value);
}

/**
 * Normalize user input toward E.164 `+91` + 10-digit Indian mobile.
 * Returns a cleaned candidate; callers should validate with `isIndianMobileE164`.
 *
 * Country-code-only (`""`, `"91"`, `"+91"`) stays `+91` — never `+9191`.
 */
export function normalizeIndianMobile(input: string): string {
  const digits = input.replace(/\D/g, "");

  // Bare country code — empty national number.
  if (digits.length === 0 || digits === "91") {
    return "+91";
  }

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]/.test(digits)) {
    return `+${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0") && /^0[6-9]/.test(digits)) {
    return `+91${digits.slice(1)}`;
  }

  if (digits.startsWith("91") && digits.length > 2) {
    return `+${digits}`;
  }

  return `+91${digits}`;
}

/**
 * National 10-digit part for UI inputs that show a fixed +91 prefix.
 * Empty / country-code-only → `""` so the field can clear.
 */
export function indianMobileNationalDigits(e164OrPartial: string): string {
  const digits = e164OrPartial.replace(/\D/g, "");
  if (digits.length === 0 || digits === "91") {
    return "";
  }

  // Every caller passes a value that already came out of
  // `normalizeIndianMobile` (or is empty), so it's already `+91`/`91`
  // prefixed — strip that prefix once rather than re-normalizing. Re-running
  // it through `normalizeIndianMobile` here used to misread "91" + an
  // 8-digit partial (10 stripped digits, starting with 9) as a bare 10-digit
  // number, corrupting the value and locking the input after 8 keystrokes.
  const national = digits.startsWith("91") ? digits.slice(2) : digits;
  return national.slice(0, 10);
}

/**
 * Read-only display: `+91 74836 21525` (or `+91` / `+91 748` while incomplete).
 */
export function formatIndianMobileDisplay(e164OrPartial: string): string {
  const national = indianMobileNationalDigits(e164OrPartial);
  if (!national) return "+91";
  if (national.length === 10) {
    return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  }
  return `+91 ${national}`;
}
