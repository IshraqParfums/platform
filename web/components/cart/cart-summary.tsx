"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import {
  cartHasSellableLines,
  type CartView,
} from "@/lib/cart/cart-view";
import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

const EASE = "duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)]";

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
  const canCheckout = cartHasSellableLines(view);
  const checkoutHref = authenticated
    ? "/checkout"
    : "/login?next=/checkout";

  return (
    <aside
      className={cn(
        "rounded-xl border border-ink/10 bg-cream-soft/90 p-6 sm:p-7",
        "shadow-[0_1px_0_rgba(28,22,18,0.03)] transition-shadow",
        EASE,
        "hover:shadow-[0_14px_32px_-22px_rgba(28,22,18,0.28)]",
        "lg:sticky lg:top-24 lg:self-start",
        className,
      )}
    >
      <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-ink">
        Summary
      </h2>

      <dl className="mt-7 space-y-4 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="tabular-nums text-ink">
            {formatPaise(view.subtotalPaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-ink-soft">Delivery</dt>
          <dd className="tabular-nums text-ink">
            {view.lines.length === 0
              ? "—"
              : formatPaise(view.shippingPaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-ink/10 pt-4">
          <dt className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
            Total
          </dt>
          <dd className="font-display text-lg font-semibold tabular-nums tracking-[-0.01em] text-ink">
            {formatPaise(view.totalPaise)}
          </dd>
        </div>
      </dl>

      {!canCheckout && view.lines.length > 0 ? (
        <p className="mt-4 text-sm text-rose-deep">
          No available items to checkout.
        </p>
      ) : null}

      <ButtonLink
        href={checkoutHref}
        variant="emphasis"
        size="md"
        className={cn(
          "mt-8 w-full cursor-pointer rounded-full",
          !canCheckout && "pointer-events-none opacity-55",
        )}
        aria-disabled={!canCheckout}
        tabIndex={canCheckout ? undefined : -1}
        onClick={(event) => {
          if (!canCheckout) event.preventDefault();
        }}
      >
        {authenticated ? "Proceed to checkout" : "Sign in to checkout"}
      </ButtonLink>

      <ul className="mt-6 space-y-2 border-t border-ink/[0.07] pt-5">
        {ASSURANCES.map((label) => (
          <li
            key={label}
            className="flex items-start gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint"
          >
            <span className="mt-px text-ink-soft" aria-hidden>
              ✓
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/shop"
        className={cn(
          "mt-5 block text-center font-mono text-label-sm uppercase tracking-wide text-ink-faint",
          "transition-colors duration-200 hover:text-ink",
        )}
      >
        Continue shopping
      </Link>
    </aside>
  );
}
