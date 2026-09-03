"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/layout/account-menu";
import { BespokeSavedNavLink } from "@/components/layout/bespoke-saved-nav-link";
import { CartNavLink } from "@/components/layout/cart-nav-link";
import { HeaderMobileNav } from "@/components/layout/header-mobile-nav";
import { HeaderShopLink } from "@/components/layout/header-mobile-shortcuts";
import { Logo } from "@/components/layout/logo";
import { WishlistNavLink } from "@/components/layout/wishlist-nav-link";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { HEADER_HEIGHT_PX, isPaperStorefrontPath } from "@/lib/layout";
import { useMobileNav } from "@/lib/ui/use-mobile-nav";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/bespoke", label: "Bespoke" },
];

/**
 * Surface modes:
 * - light glass bar on paper routes (graphite on parchment)
 * - solid espresso bar on every other route
 * - when the phone menu is open, the bar + list become one opaque sheet
 *   so the page underneath (cart lines, etc.) does not show through a wash
 *
 * The home branch used to be the transparent one: the old hero was a full-bleed
 * espresso plate and the nav floated over it, going solid past 40px of scroll.
 * The v2 home page is paper top to bottom, and a transparent bar on paper is
 * exactly the failure the previous version of this comment warned about — the
 * logo vanishes. So home now gets its own surface rather than an absence of one,
 * and the scroll listener is gone with it.
 *
 * Everything below the surface switch is shared: one nav, one mobile panel, one
 * set of controls. Only the palette forks.
 */
export function Header() {
  const pathname = usePathname();
  const light = isPaperStorefrontPath(pathname);
  const { open, close, toggle, rootRef } = useMobileNav();

  return (
    <header
      ref={rootRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 overflow-visible border-b",
        open && "bottom-0 flex flex-col md:bottom-auto md:block",
        open
          ? light
            ? "border-graphite/[0.07] bg-paper"
            : "border-gold/15 bg-deep"
          : cn(
              "backdrop-blur-md",
              light
                ? "border-graphite/[0.07] bg-paper/70"
                : "border-gold/15 bg-deep/92",
            ),
      )}
    >
      <Container size="wide">
        <div
          className="flex items-center justify-between gap-6"
          style={{ height: HEADER_HEIGHT_PX }}
        >
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={close}
          >
            <Logo tone={light ? "light" : "dark"} priority />
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100",
                  light
                    ? "font-ui text-nav font-medium uppercase text-graphite/75 hover:text-terra after:bg-terra"
                    : "text-sm font-medium text-cream/80 hover:text-cream-soft after:bg-gold",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 overflow-visible md:gap-2">
            <HeaderShopLink
              tone={light ? "light" : "dark"}
              onNavigate={close}
            />
            <AccountMenu tone={light ? "light" : "dark"} />
            <div className="hidden md:block">
              <WishlistNavLink tone={light ? "light" : "dark"} />
            </div>
            <div className="hidden md:block">
              <BespokeSavedNavLink tone={light ? "light" : "dark"} />
            </div>
            <CartNavLink tone={light ? "light" : "dark"} />

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={toggle}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden",
                light
                  ? "text-graphite/75 hover:bg-graphite/[0.06]"
                  : "text-cream/85 hover:bg-cream/10",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                ) : (
                  <path d="M4 8h16M4 16h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      {open ? (
        <nav
          className={cn(
            "min-h-0 flex-1 overflow-y-auto border-t md:hidden",
            light
              ? "border-graphite/[0.07] bg-paper"
              : "border-gold/15 bg-deep",
          )}
        >
          <Container size="wide">
            <HeaderMobileNav
              tone={light ? "light" : "dark"}
              onNavigate={close}
            />
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
