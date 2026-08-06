"use client";

import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

const ITEMS = [
  "Secure Razorpay payment",
  `Flat ${formatPaise(SHIPPING_PAISE)} shipping`,
  "Crafted in India",
] as const;

/**
 * Reassurance under the pay CTA. It wraps onto one or two rows where the CTA
 * is full width, and stacks in the narrow totals column — no prop needed,
 * because the right form follows from the width it is given.
 */
export function CheckoutTrustInfo({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1.5 md:block md:space-y-1.5",
        className,
      )}
    >
      {ITEMS.map((label) => (
        <li
          key={label}
          className="flex items-center gap-1.5 font-mono text-label-sm uppercase text-ink-faint"
        >
          <span className="text-ink-soft" aria-hidden>
            ✓
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
