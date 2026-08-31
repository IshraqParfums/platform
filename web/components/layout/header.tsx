"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/layout/account-menu";
import { BespokeSavedNavLink } from "@/components/layout/bespoke-saved-nav-link";
import { CartNavLink } from "@/components/layout/cart-nav-link";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { ACCOUNT_HOME } from "@/lib/auth/account-routes";
import { cn } from "@/lib/cn";
import { HEADER_HEIGHT_PX, isPaperStorefrontPath } from "@/lib/layout";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/bespoke", label: "Bespoke" },
];

/**
 * Surface modes:
 * - light glass bar on the home page (graphite/indigo on paper), from scroll
 *   position zero
 * - solid espresso bar on every other route, and when the mobile menu is open
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md",
        light
          ? "border-graphite/[0.07] bg-paper/70"
          : "border-gold/15 bg-deep/92",
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
            onClick={() => setOpen(false)}
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

          <div className="flex items-center gap-2">
            <AccountMenu tone={light ? "light" : "dark"} />
            <BespokeSavedNavLink tone={light ? "light" : "dark"} />
            <CartNavLink tone={light ? "light" : "dark"} />

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
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
            "border-t backdrop-blur-md md:hidden",
            light
              ? "border-graphite/[0.07] bg-paper/[0.97]"
              : "border-gold/15 bg-deep/97",
          )}
        >
          <Container size="wide">
            <div className="flex flex-col py-3">
              {[
                ...NAV,
                { href: "/bespoke/saved", label: "Saved blends" },
                { href: "/cart", label: "Cart" },
                { href: ACCOUNT_HOME, label: "Account" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "border-b py-4 text-lg last:border-0",
                    light
                      ? "border-graphite/10 font-editorial text-graphite"
                      : "border-cream/8 font-display text-cream-soft",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
