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
 * too. `/collections` is one tap from the header nav on any paper page and
 * routes straight back into `/shop`, so it joined for the same reason.
 * `/account` (and its order-history subroutes) joined next — it's reachable
 * from the header on every paper page and is where checkout's own receipt
 * (`/account/orders/[id]`) lands right after payment, so the chrome must
 * already be paper by the time a customer arrives there. `/login` closes
 * the loop: it's the one page every one of the above can redirect *to*
 * (`loginPath()`), so the door has to match the house. `/privacy`, `/terms`
 * and `/contact` round it out — footer links reachable from every page
 * above, so they can't be the one tab that still flashes espresso.
 */
export function isPaperStorefrontPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/cart" ||
    pathname === "/wishlist" ||
    pathname === "/checkout" ||
    pathname === "/collections" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/contact" ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/bespoke") ||
    pathname.startsWith("/account")
  );
}
