/** Fixed header height — keep layout offset, hero underlay, and Header in sync. */
export const HEADER_HEIGHT_PX = 68;

/**
 * Storefront routes that use v2 parchment (header, footer).
 * `/products/` is the public PDP; admin lives under `/admin/products`.
 */
export function isPaperStorefrontPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/shop" ||
    pathname.startsWith("/products/")
  );
}
