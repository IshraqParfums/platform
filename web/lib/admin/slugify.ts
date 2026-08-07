/**
 * Admin URL slug helper — matches Nest SLUG_PATTERN:
 * /^[a-z0-9]+(-[a-z0-9]+)*$/
 */

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Normalize display text into a kebab-case slug (may be empty while typing). */
export function slugify(input: string): string {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized;
}

/** True when the string is a complete valid API slug. */
export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/**
 * Sanitize an in-progress slug field (user typing). Allows trailing hyphen
 * while editing; strips invalid characters.
 */
export function sanitizeSlugInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-/, "");
}
