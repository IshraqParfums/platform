"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { shopFetch } from "@/lib/auth/shop-fetch";
import { readLocalCartCount } from "@/lib/cart/cart-client";
import { subscribeCartChanged } from "@/lib/cart/cart-events";
import { cn } from "@/lib/cn";

/**
 * Header bag link with live item count badge.
 */
export type CartNavTone = "dark" | "light";

/** See the note on BespokeSavedNavLink — colour rides on `tone`, not className. */
const CONTROL: Record<CartNavTone, string> = {
  dark: "text-cream/85 hover:bg-cream/10 hover:text-cream-soft",
  light: "text-graphite/75 hover:bg-graphite/[0.06] hover:text-graphite",
};

const BADGE: Record<CartNavTone, string> = {
  dark: "bg-gold text-deep",
  light: "bg-indigo text-shell",
};

const HEADER_CART_COUNT_KEY = "ishraq_header_cart_count";

function readHeaderCartCount(): number {
  const local = readLocalCartCount();
  if (local > 0) return local;
  try {
    const raw = sessionStorage.getItem(HEADER_CART_COUNT_KEY);
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function rememberHeaderCartCount(n: number) {
  try {
    sessionStorage.setItem(HEADER_CART_COUNT_KEY, String(n));
  } catch {
    /* private mode */
  }
}

export function CartNavLink({ tone = "dark" }: { tone?: CartNavTone }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const seed = readHeaderCartCount();
    setCount(seed);

    async function refresh() {
      try {
        const response = await shopFetch("/api/cart", { cache: "no-store" });
        if (cancelled) return;
        if (response.ok) {
          const data = (await response.json()) as { itemCount?: number };
          if (typeof data.itemCount === "number") {
            rememberHeaderCartCount(data.itemCount);
            setCount(data.itemCount);
            return;
          }
        }
        const local = readLocalCartCount();
        rememberHeaderCartCount(local);
        setCount(local);
      } catch {
        if (!cancelled) {
          const local = readLocalCartCount();
          rememberHeaderCartCount(local);
          setCount(local);
        }
      }
    }

    void refresh();
    const unsubscribe = subscribeCartChanged((detail) => {
      rememberHeaderCartCount(detail.itemCount);
      setCount(detail.itemCount);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const label =
    count > 0 ? `Cart, ${count > 9 ? "9+" : count} items` : "Cart";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className={cn(
        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-full transition-colors",
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
          d="M6 7h12l-1 12H7L6 7z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M9.5 9V6a2.5 2.5 0 0 1 5 0v3" strokeLinecap="round" />
      </svg>
      {count > 0 ? (
        <span
          className={cn(
            "pointer-events-none absolute right-0.5 top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-semibold leading-none",
            BADGE[tone],
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
