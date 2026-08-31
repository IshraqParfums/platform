"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { loadCart } from "@/lib/cart/cart-client";
import { emitCartChanged } from "@/lib/cart/cart-events";
import {
  cartHasSellableLines,
  cartUnavailableLines,
  type CartView,
} from "@/lib/cart/cart-view";
import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

const EASE = "duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)]";

const ASSURANCES = [
  "Secure Razorpay checkout",
  `Flat ${formatPaise(SHIPPING_PAISE)} shipping`,
  "Crafted in India",
] as const;

export function CartSummary({
  view,
  authenticated,
  className,
}: {
  view: CartView;
  authenticated: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [flushing, setFlushing] = useState(false);
  const canCheckout = cartHasSellableLines(view);
  const unavailableCount = cartUnavailableLines(view).length;
  const checkoutHref = authenticated
    ? "/checkout"
    : "/login?next=/checkout";

  /**
   * Re-fetch so a product made unavailable in another tab
   * cannot slip through on a stale cart view.
   */
  async function proceedToCheckout() {
    if (!canCheckout || flushing) return;

    setFlushing(true);
    try {
      const fresh = await loadCart();
      emitCartChanged({ itemCount: fresh.itemCount, view: fresh });

      if (!cartHasSellableLines(fresh)) {
        toast.error(
          "Nothing available to checkout",
          unavailableCount > 0 || cartUnavailableLines(fresh).length > 0
            ? "Remove unavailable items or wait until stock returns."
            : "Your cart has no purchasable items.",
        );
        return;
      }

      router.push(checkoutHref);
    } catch (err) {
      toast.error(
        "Could not update cart",
        err instanceof Error ? err.message : "Try again before checkout",
      );
    } finally {
      setFlushing(false);
    }
  }

  return (
    <aside
      className={cn(
        "rounded-[4px] border border-graphite/10 bg-shell p-6 sm:p-7",
        "shadow-[0_18px_44px_-30px_rgba(22,19,16,0.42)] transition-shadow",
        EASE,
        "lg:sticky lg:top-24 lg:self-start",
        className,
      )}
    >
      <h2 className="font-editorial text-[22px] leading-none text-graphite">
        Summary
      </h2>

      <dl className="mt-7 space-y-4 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-graphite-soft">Subtotal</dt>
          <dd className="tabular-nums text-graphite">
            {formatPaise(view.subtotalPaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-graphite-soft">Delivery</dt>
          <dd className="tabular-nums text-graphite">
            {view.lines.length === 0
              ? "–"
              : formatPaise(view.shippingPaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-graphite/10 pt-4">
          <dt className="font-editorial text-[19px] leading-none text-graphite">
            Total
          </dt>
          <dd className="font-editorial text-[19px] leading-none tabular-nums text-graphite">
            {formatPaise(view.totalPaise)}
          </dd>
        </div>
      </dl>

      {!canCheckout && view.lines.length > 0 ? (
        <p className="mt-4 text-sm text-terra">
          {unavailableCount === view.lines.length
            ? "All items in your cart are unavailable. Remove them or wait until they return."
            : "No available items to checkout."}
        </p>
      ) : unavailableCount > 0 ? (
        <p className="mt-4 text-sm text-graphite-soft">
          Unavailable items stay in your cart but are not charged at checkout.
        </p>
      ) : null}

      {canCheckout ? (
        <Button
          type="button"
          variant="ink"
          size="pill"
          disabled={flushing}
          className="mt-8 w-full cursor-pointer"
          onClick={() => void proceedToCheckout()}
        >
          {flushing
            ? "Checking cart…"
            : authenticated
              ? "Proceed to checkout"
              : "Sign in to checkout"}
        </Button>
      ) : (
        <ButtonLink
          href={checkoutHref}
          variant="ink"
          size="pill"
          className="mt-8 w-full cursor-pointer pointer-events-none opacity-55"
          aria-disabled
          tabIndex={-1}
          onClick={(event) => event.preventDefault()}
        >
          {authenticated ? "Proceed to checkout" : "Sign in to checkout"}
        </ButtonLink>
      )}

      {/*
        Terra ticks, not checkmarks. A raw "✓" glyph is a hand-rolled
        decorative mark, and the paper surface deliberately uses none —
        nothing else on it reaches for an icon set either (see the note in
        bespoke-entry.tsx). The tick is the same mark the consultation
        record and the Materials elbows already draw with, so this list
        reads as this page's own furniture rather than borrowed chrome.
      */}
      <ul className="mt-6 space-y-2.5 border-t border-graphite/10 pt-5">
        {ASSURANCES.map((label) => (
          <li
            key={label}
            className="flex items-center gap-3 font-ui text-[11px] uppercase tracking-[0.1em] text-graphite-faint"
          >
            <span aria-hidden="true" className="h-px w-3 shrink-0 bg-terra/60" />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/shop"
        className={cn(
          "mt-5 block text-center font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint",
          "transition-colors duration-300 hover:text-terra",
        )}
      >
        Continue shopping
      </Link>
    </aside>
  );
}
