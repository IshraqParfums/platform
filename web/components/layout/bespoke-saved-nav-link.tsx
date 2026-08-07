"use client";

import Link from "next/link";

/**
 * Header shortcut to saved bespoke blends — same circular control language
 * as the cart bag. Guests hitting /bespoke/saved are sent to login by that page.
 */
export function BespokeSavedNavLink() {
  return (
    <Link
      href="/bespoke/saved"
      aria-label="Saved bespoke blends"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-cream/85 transition-colors hover:bg-cream/10 hover:text-cream-soft"
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
