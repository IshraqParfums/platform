"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The header runs espresso on every route but the home page, which is paper.
 * `tone` picks the surface rather than letting a caller pass a colour class:
 * `cn()` is a plain join with no Tailwind conflict resolution, so an override
 * from outside would sit alongside the hardcoded colour and let the cascade
 * decide the winner. Same reasoning as `Eyebrow` and `Button`.
 */
export type NavLinkTone = "dark" | "light";

const CONTROL: Record<NavLinkTone, string> = {
  dark: "text-cream/85 hover:bg-cream/10 hover:text-cream-soft",
  light: "text-graphite/75 hover:bg-graphite/[0.06] hover:text-graphite",
};

/**
 * Header shortcut to saved bespoke blends — same circular control language
 * as the cart bag. Guests hitting /bespoke/saved are sent to login by that page.
 */
export function BespokeSavedNavLink({
  tone = "dark",
}: {
  tone?: NavLinkTone;
}) {
  return (
    <Link
      href="/bespoke/saved"
      aria-label="Saved bespoke blends"
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        CONTROL[tone],
      )}
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
          d="M9 3h6v3H9V3z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M8 6h8l-1 14H9L8 6z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M10 11h4" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
