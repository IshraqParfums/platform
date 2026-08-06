/** India mobile in E.164 — extend later for other countries. */
export const INDIAN_MOBILE_E164_PATTERN = String.raw`^\+91[6-9]\d{9}$`;

export const INDIAN_MOBILE_E164_RE = new RegExp(INDIAN_MOBILE_E164_PATTERN);

export function isIndianMobileE164(value: string): boolean {
  return INDIAN_MOBILE_E164_RE.test(value);
}

/**
 * Normalize user input toward E.164 `+91` + 10-digit Indian mobile.
 * Returns a cleaned candidate; callers should validate with `isIndianMobileE164`.
 */
export function normalizeIndianMobile(input: string): string {
  const digits = input.replace(/\D/g, "");

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

  if (digits.length > 0) {
    return `+91${digits}`;
  }

  return "+91";
}

/** National 10-digit part for UI inputs that show a fixed +91 prefix. */
export function indianMobileNationalDigits(e164OrPartial: string): string {
  const normalized = normalizeIndianMobile(e164OrPartial);
  if (normalized.startsWith("+91")) {
    return normalized.slice(3).replace(/\D/g, "").slice(0, 10);
  }
  return e164OrPartial.replace(/\D/g, "").slice(0, 10);
}
