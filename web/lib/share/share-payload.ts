/**
 * Canonical share content — channel UIs and Web Share API both consume this.
 */

export type SharePayload = {
  /** Short title (native share / email subject / social title). */
  title: string;
  /** Human message without the URL — channels append the link themselves. */
  text: string;
  /** Absolute or site-relative URL to the shared resource. */
  url: string;
};

export type ProductShareInput = {
  name: string;
  /**
   * Absolute or relative URL. Empty/omitted when the UI should use the current page.
   */
  url?: string;
  /** Optional blurb override (e.g. short description). */
  blurb?: string;
};

const BRAND = "Ishraq Parfums";

/**
 * Branded product share copy — not a bare link dump.
 * Callers that defer URL to the current page can omit `url` and fill it in at share time.
 */
export function buildProductSharePayload({
  name,
  url = "",
  blurb,
}: ProductShareInput): SharePayload {
  const line = blurb?.trim()
    ? blurb.trim()
    : `Discover ${name} from ${BRAND} — fragrance crafted to linger.`;

  return {
    title: `${name} · ${BRAND}`,
    text: line,
    url,
  };
}

/** Absolute shop PDP path from a product slug. */
export function shopProductPath(slug: string): string {
  return `/products/${slug}`;
}

/**
 * Resolve a share URL in the browser. Relative paths become absolute via origin.
 */
export function resolveShareUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${window.location.origin}${path}`;
}

/** Clipboard / chat paste: message + blank line + URL. */
export function formatShareClipboard(payload: SharePayload): string {
  return `${payload.text}\n\n${payload.url}`;
}
