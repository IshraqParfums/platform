/** Fixed header height — keep layout offset, hero underlay, and Header in sync. */
export const HEADER_HEIGHT_PX = 68;

/**
 * Storefront routes that use v2 parchment (header, footer).
 * `/products/` is the public PDP; admin lives under `/admin/products`.
 * `/bespoke` covers the whole consultation: the pitch, the quiz itself, the
 * result and the saved-formula locker all moved onto v2 tokens together, so
 * a visitor never crosses from parchment into espresso mid-consultation.
 */
export function isPaperStorefrontPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/shop" ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/bespoke")
  );
}
