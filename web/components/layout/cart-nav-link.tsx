"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { shopFetch } from "@/lib/auth/shop-fetch";
import { readLocalCartCount } from "@/lib/cart/cart-client";
import { subscribeCartChanged } from "@/lib/cart/cart-events";

/**
 * Header bag link with live item count badge.
 */
export function CartNavLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await shopFetch("/api/cart", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { itemCount?: number };
          if (!cancelled) {
            setCount(typeof data.itemCount === "number" ? data.itemCount : 0);
          }
          return;
        }
        if (!cancelled) setCount(readLocalCartCount());
      } catch {
        if (!cancelled) setCount(readLocalCartCount());
      }
    }

    void refresh();
    const unsubscribe = subscribeCartChanged((detail) => {
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
          d="M6 7h12l-1 12H7L6 7z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M9.5 9V6a2.5 2.5 0 0 1 5 0v3" strokeLinecap="round" />
      </svg>
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-mono text-[10px] font-semibold leading-none text-deep">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
