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
 * Reassurance under the pay CTA. Terra hairline ticks, matching the same
 * assurance list on `/cart` — no icon glyph, the paper surface doesn't reach
 * for a set. It wraps onto one or two rows where the CTA is full width, and
 * stacks in the narrow totals column — no prop needed, because the right
 * form follows from the width it is given.
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
          className="flex items-center gap-2.5 font-ui text-[11px] uppercase tracking-[0.1em] text-graphite-faint"
        >
          <span aria-hidden="true" className="h-px w-3 shrink-0 bg-terra/60" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
