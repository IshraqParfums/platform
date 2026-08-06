"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { CartView } from "@/lib/cart/cart-view";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

const PREVIEW_COUNT = 3;

/**
 * Sticky order summary. Pass `footer` (e.g. PaymentSection) so Pay stays with totals.
 */
export function OrderSummaryCard({
  view,
  footer,
  className,
}: {
  view: CartView;
  footer?: ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const overflow = view.lines.length > PREVIEW_COUNT;
  const visibleLines =
    expanded || !overflow ? view.lines : view.lines.slice(0, PREVIEW_COUNT);
  const hiddenCount = view.lines.length - PREVIEW_COUNT;

  return (
    <aside
      className={cn(
        "rounded-xl border border-ink/10 bg-cream-soft/90 p-5 sm:p-6",
        "shadow-[0_1px_0_rgba(28,22,18,0.03)]",
        "lg:sticky lg:top-24 lg:self-start",
        className,
      )}
    >
      <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-ink">
        Order summary
      </h2>

      <ul className="mt-4 divide-y divide-ink/[0.07] border-t border-ink/[0.07]">
        {visibleLines.map((line) => (
          <li key={line.key} className="flex justify-between gap-4 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{line.productName}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {line.sizeMl} ml · Qty {line.quantity}
              </p>
            </div>
            <p className="shrink-0 tabular-nums text-ink">
              {formatPaise(line.lineTotalPaise)}
            </p>
          </li>
        ))}
      </ul>

      {overflow ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-0.5 w-full cursor-pointer border-b border-ink/[0.07] py-2.5 text-left font-mono text-label-sm uppercase tracking-wide text-ink-faint transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30"
        >
          {expanded ? "Show fewer items" : `+${hiddenCount} more items`}
        </button>
      ) : (
        <div className="border-b border-ink/[0.07]" />
      )}

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="tabular-nums text-ink">
            {formatPaise(view.subtotalPaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-ink-soft">Delivery</dt>
          <dd className="tabular-nums text-ink">
            {formatPaise(view.shippingPaise)}
          </dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-ink/10 pt-2.5">
          <dt className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
            Total
          </dt>
          <dd className="font-display text-lg font-semibold tabular-nums tracking-[-0.01em] text-ink">
            {formatPaise(view.totalPaise)}
          </dd>
        </div>
      </dl>

      {footer ? (
        <div className="mt-5 border-t border-ink/10 pt-5">{footer}</div>
      ) : null}

      <Link
        href="/cart"
        className="mt-4 block font-mono text-label-sm uppercase tracking-wide text-ink-faint transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30"
      >
        Edit cart
      </Link>
    </aside>
  );
}
