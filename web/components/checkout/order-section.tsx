"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
import { PaymentSection } from "@/components/checkout/payment-section";
import { cartItemCountLabel } from "@/lib/cart/cart-copy";
import {
  cartSellableLines,
  type CartView,
} from "@/lib/cart/cart-view";
import { formatPaise } from "@/lib/format/money";

/** Enough lines to recognise the order; the rest are one tap away. */
const PREVIEW_COUNT = 3;

/**
 * Order summary lists only sellable lines — unavailable cart rows never appear
 * at checkout (totals already exclude them).
 */
export function OrderSection({
  step,
  view,
  disabled,
  preparing,
  onPay,
}: {
  step: string;
  view: CartView;
  disabled?: boolean;
  preparing?: boolean;
  onPay: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const sellable = cartSellableLines(view);
  const sellableQty = sellable.reduce((sum, line) => sum + line.quantity, 0);
  const overflow = sellable.length > PREVIEW_COUNT;
  const visibleLines =
    showAll || !overflow ? sellable : sellable.slice(0, PREVIEW_COUNT);
  const hiddenCount = sellable.length - PREVIEW_COUNT;

  return (
    <CheckoutSection
      step={step}
      title="Order summary"
      description={cartItemCountLabel(sellableQty)}
      action={
        <Link
          href="/cart"
          className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint transition-colors duration-200 hover:text-terra focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite/30"
        >
          Edit cart
        </Link>
      }
    >
      <div className={checkoutLayoutV2.panel}>
        <div className={checkoutLayoutV2.panelSplit}>
          <div className="min-w-0">
            <ul className="divide-y divide-graphite/[0.07]">
              {visibleLines.map((line) => (
                <li
                  key={line.key}
                  className="flex justify-between gap-4 py-3 text-sm first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-graphite">
                      {line.productName}
                    </p>
                    <p className="mt-0.5 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                      {line.sizeMl} ml · Qty {line.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums text-graphite">
                    {formatPaise(line.lineTotalPaise)}
                  </p>
                </li>
              ))}
            </ul>

            {overflow ? (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="mt-3 cursor-pointer font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint transition-colors duration-200 hover:text-terra focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite/30"
              >
                {showAll ? "Show fewer items" : `+${hiddenCount} more items`}
              </button>
            ) : null}
          </div>

          <div className={checkoutLayoutV2.panelAside}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-graphite-soft">Subtotal</dt>
                <dd className="tabular-nums text-graphite">
                  {formatPaise(view.subtotalPaise)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-graphite-soft">Delivery</dt>
                <dd className="tabular-nums text-graphite">
                  {formatPaise(view.shippingPaise)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 border-t border-graphite/10 pt-3">
                <dt className="font-editorial text-[19px] leading-none text-graphite">
                  Total
                </dt>
                <dd className="font-editorial text-[19px] leading-none tabular-nums text-graphite">
                  {formatPaise(view.totalPaise)}
                </dd>
              </div>
            </dl>

            <PaymentSection
              className="mt-6"
              totalPaise={view.totalPaise}
              disabled={disabled}
              preparing={preparing}
              onPay={onPay}
            />
          </div>
        </div>
      </div>
    </CheckoutSection>
  );
}
