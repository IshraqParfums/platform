"use client";

import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import { formatPaise } from "@/lib/format/money";

const ITEMS = [
  "Secure Razorpay payment",
  `Flat ${formatPaise(SHIPPING_PAISE)} shipping`,
  "Crafted in India",
] as const;

export function CheckoutTrustInfo({ className }: { className?: string }) {
  return (
    <ul className={className}>
      {ITEMS.map((label) => (
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
  );
}
