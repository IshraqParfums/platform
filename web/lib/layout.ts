/** Fixed header height — keep layout offset, hero underlay, and Header in sync. */
export const HEADER_HEIGHT_PX = 68;

/**
 * Storefront routes that use v2 parchment (header, footer).
 * `/products/` is the public PDP; admin lives under `/admin/products`.
 * `/bespoke` covers the whole consultation: the pitch, the quiz itself, the
 * result and the saved-formula locker all moved onto v2 tokens together, so
 * a visitor never crosses from parchment into espresso mid-consultation.
 * `/cart` joined them for the same reason — it's one tap from a bespoke
 * result or a paper PDP, and a visitor landing on it should never see the
 * bar flash to espresso for one page in the middle of an otherwise-paper
 * journey. `/checkout` is the very next tap after `/cart`, so it joined
 * too — account (`/account`, order history) stays on v1 for now.
 */
export function isPaperStorefrontPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/bespoke")
  );
}
