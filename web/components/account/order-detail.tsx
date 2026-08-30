"use client";

import { useCallback } from "react";
import Link from "next/link";
import type { OrderDetail as OrderDetailResponse } from "@ishraqparfums/shared";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import { OrderDetailSkeleton } from "@/components/account/account-skeletons";
import { OrderProgress } from "@/components/account/order-progress";
import { OrderStatusChip } from "@/components/account/order-status-chip";
import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
import { FactRecord } from "@/components/ui/fact-record";
import { Button, ButtonLink } from "@/components/ui/button";
import { classifyApiError } from "@/lib/api/api-error";
import { accountOrderPath } from "@/lib/auth/account-routes";
import { useGuardedLoad } from "@/lib/auth/use-guarded-load";
import { formatPaise } from "@/lib/format/money";
import { getOrder } from "@/lib/orders/orders-client";
import {
  formatOrderDateTime,
  orderReference,
} from "@/lib/orders/order-status";
import { orderItemHref } from "@/lib/orders/order-item-href";
import { cn } from "@/lib/cn";

/**
 * One order, in full — the confirmation straight after payment and the record
 * months later are the same page, so they stay one component. `justPlaced`
 * (from checkout's `?placed=1`) is the only thing that changes the greeting.
 *
 * Order items carry no imagery, so this reads as a receipt: status first, then
 * where it is going, then what it cost.
 */
export function OrderDetail({
  orderId,
  justPlaced = false,
}: {
  orderId: string;
  justPlaced?: boolean;
}) {
  const load = useCallback(() => getOrder(orderId), [orderId]);
  const { state, data: order, error, reload } = useGuardedLoad(
    load,
    accountOrderPath(orderId),
  );

  if (state === "error") {
    // A wrong, malformed, or someone else's order id can never resolve; only a
    // fault on our side is worth a retry.
    return classifyApiError(error) === "unavailable" ? (
      <OrderUnavailableScreen />
    ) : (
      <OrderLoadFailedScreen onRetry={reload} />
    );
  }

  if (state === "loading" || !order) return <OrderDetailSkeleton />;

  return <OrderDetailView order={order} justPlaced={justPlaced} />;
}

/** Pure presentation, so every state can be rendered without a session. */
export function OrderDetailView({
  order,
  justPlaced = false,
}: {
  order: OrderDetailResponse;
  justPlaced?: boolean;
}) {
  const paid =
    order.payment?.status === "PAID" ||
    (order.status !== "PENDING_PAYMENT" &&
      order.status !== "FAILED" &&
      order.status !== "EXPIRED");

  return (
    <div>
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <OrderStatusChip status={order.status} />
          {/* The reference lives in the heading unless the heading is a
              greeting — it should be stated once, not twice. */}
          {justPlaced && paid ? (
            <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
              {orderReference(order.id)}
            </span>
          ) : null}
        </div>

        <h1 className="mt-5 font-editorial text-[clamp(30px,4.2vw,42px)] leading-[1.04] text-graphite">
          {justPlaced && paid ? "Thank you" : `Order ${orderReference(order.id)}`}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft">
          {justPlaced && paid
            ? "Your payment was received. We’ll keep you updated as your order moves forward."
            : `Placed ${formatOrderDateTime(order.createdAt)}.`}
        </p>
      </header>

      <OrderProgress status={order.status} className="mt-7" />

      {order.status === "PENDING_PAYMENT" && order.expiresAt ? (
        <p className="mt-7 border-l-2 border-terra/40 pl-4 text-sm leading-relaxed text-terra">
          This order is still awaiting payment and is held until{" "}
          {formatOrderDateTime(order.expiresAt)}.
        </p>
      ) : null}

      {/* Placed date and total are already stated above and in the receipt —
          these are the facts that appear nowhere else. */}
      <div className="mt-9 border-y border-graphite/10 py-7">
        <FactRecord
          fields={[
            {
              label: "Contact",
              value: (
                <>
                  {order.customerName}
                  <br />
                  <span className="text-graphite-soft">
                    {order.customerEmail}
                  </span>
                </>
              ),
            },
            {
              label: "Ship to",
              value: (
                <>
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? (
                    <>
                      <br />
                      {order.shippingAddress.line2}
                    </>
                  ) : null}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                  <br />
                  {formatIndianMobileDisplay(order.shippingAddress.phone)}
                </>
              ),
              valueClassName: "text-graphite-soft",
            },
            ...(order.payment?.razorpayPaymentId
              ? [
                  {
                    label: "Payment reference",
                    value: (
                      <span className="break-all font-mono text-[13px]">
                        {order.payment.razorpayPaymentId}
                      </span>
                    ),
                    valueClassName: "text-graphite-soft",
                  },
                ]
              : []),
          ]}
        />
      </div>

      <OrderReceipt order={order} />

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/shop" variant="ink" size="md">
          Continue shopping
        </ButtonLink>
        <ButtonLink href="/collections" variant="outline-paper" size="md">
          Browse collections
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * Items beside totals — the same receipt split checkout closes with. Reuses
 * checkout's own `checkoutLayoutV2` panel tokens rather than a separate
 * account copy: this is deliberately the same shape as checkout's order
 * summary, not a coincidence.
 */
function OrderReceipt({ order }: { order: OrderDetailResponse }) {
  return (
    <div className={cn(checkoutLayoutV2.panel, "mt-8")}>
      <div className={checkoutLayoutV2.panelSplit}>
        <ul className="divide-y divide-graphite/[0.07]">
          {order.items.map((item) => {
            const href = orderItemHref(item);
            return (
            <li
              key={item.id}
              className="flex justify-between gap-4 py-3 text-sm first:pt-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-graphite">
                  {href ? (
                    <Link
                      href={href}
                      className="underline decoration-transparent decoration-1 underline-offset-[3px] transition-colors duration-200 hover:decoration-terra/50"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    item.productName
                  )}
                </p>
                <p className="mt-0.5 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                  {item.sizeMl} ml · Qty {item.quantity}
                  {item.kind === "bespoke" ? " · Bespoke" : ""}
                </p>
              </div>
              <p className="shrink-0 tabular-nums text-graphite">
                {formatPaise(item.lineTotalPaise)}
              </p>
            </li>
            );
          })}
        </ul>

        <div className={checkoutLayoutV2.panelAside}>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-graphite-soft">Subtotal</dt>
              <dd className="tabular-nums text-graphite">
                {formatPaise(order.subtotalPaise)}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-graphite-soft">Delivery</dt>
              <dd className="tabular-nums text-graphite">
                {formatPaise(order.shippingPaise)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-t border-graphite/10 pt-3">
              <dt className="font-editorial text-[19px] leading-none text-graphite">
                Total
              </dt>
              <dd className="font-editorial text-[19px] leading-none tabular-nums text-graphite">
                {formatPaise(order.totalPaise)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function OrderUnavailableScreen() {
  return (
    <div className="max-w-lg py-6">
      <h1 className="font-editorial text-[clamp(28px,3.4vw,36px)] leading-[1.05] text-graphite">
        Order not available
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft">
        We couldn’t find this order on your account. The link may be incorrect,
        or it may belong to a different one.
      </p>
      <div className="mt-8">
        <ButtonLink href="/shop" variant="outline-paper" size="md">
          Back to shop
        </ButtonLink>
      </div>
    </div>
  );
}

export function OrderLoadFailedScreen({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="max-w-lg py-6">
      <h1 className="font-editorial text-[clamp(28px,3.4vw,36px)] leading-[1.05] text-graphite">
        Couldn’t load order
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-graphite-soft">
        Something went wrong on our side. Your order is safe — please try again
        in a moment.
      </p>
      <Button
        type="button"
        variant="outline-paper"
        size="md"
        className="mt-8 cursor-pointer"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}
