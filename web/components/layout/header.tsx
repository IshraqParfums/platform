"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/bespoke", label: "Bespoke" },
];

function Monogram() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 font-display text-[15px] font-semibold text-gold-soft">
      I
    </span>
  );
}

export function Header() {
  // Transparent over the espresso hero, solid once the user scrolls past it.
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        solid || open
          ? "border-b border-gold/15 bg-deep/92 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container size="wide">
        <div className="flex h-[68px] items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <Monogram />
            <span className="font-display text-[17px] font-semibold tracking-tight text-cream-soft">
              Ishraq
              <span className="ml-1.5 font-mono text-label-sm uppercase text-gold-soft/75">
                Parfums
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative py-1 text-sm font-medium text-cream/80 transition-colors hover:text-cream-soft after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream-soft sm:inline-flex"
            >
              Account
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="flex h-10 w-10 items-center justify-center rounded-full text-cream/85 transition-colors hover:bg-cream/10 hover:text-cream-soft"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-[19px] w-[19px]"
                aria-hidden="true"
              >
                <path
                  d="M6 7h12l-1 12H7L6 7z"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  d="M9.5 9V6a2.5 2.5 0 0 1 5 0v3"
                  strokeLinecap="round"
                />
              </svg>
            </Link>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-cream/85 transition-colors hover:bg-cream/10 md:hidden"
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

      {open && (
        <nav className="border-t border-gold/15 bg-deep/97 backdrop-blur-md md:hidden">
          <Container size="wide">
            <div className="flex flex-col py-3">
              {[...NAV, { href: "/login", label: "Account" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-cream/8 py-4 font-display text-lg text-cream-soft last:border-0"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
