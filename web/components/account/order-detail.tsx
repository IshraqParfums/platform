"use client";

import { useCallback } from "react";
import Link from "next/link";
import type { OrderDetail as OrderDetailResponse } from "@ishraqparfums/shared";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import { OrderDetailSkeleton } from "@/components/account/account-skeletons";
import { OrderProgress } from "@/components/account/order-progress";
import { OrderStatusChip } from "@/components/account/order-status-chip";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
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
            <span className="font-mono text-label-sm uppercase text-ink-faint">
              {orderReference(order.id)}
            </span>
          ) : null}
        </div>

        <h1 className="mt-5 font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
          {justPlaced && paid ? "Thank you" : `Order ${orderReference(order.id)}`}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          {justPlaced && paid
            ? "Your payment was received. We’ll keep you updated as your order moves forward."
            : `Placed ${formatOrderDateTime(order.createdAt)}.`}
        </p>
      </header>

      <OrderProgress status={order.status} className="mt-7" />

      {order.status === "PENDING_PAYMENT" && order.expiresAt ? (
        <p className="mt-7 border-l-2 border-rose-deep/40 pl-4 text-sm leading-relaxed text-rose-deep">
          This order is still awaiting payment and is held until{" "}
          {formatOrderDateTime(order.expiresAt)}.
        </p>
      ) : null}

      {/* Placed date and total are already stated above and in the receipt —
          these are the facts that appear nowhere else. */}
      <dl className="mt-9 grid gap-6 border-y border-ink/[0.08] py-7 text-sm sm:grid-cols-2">
        <Fact label="Contact">
          {order.customerName}
          <br />
          <span className="text-ink-soft">{order.customerEmail}</span>
        </Fact>
        <Fact label="Ship to" valueClassName="text-ink-soft">
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
        </Fact>
        {order.payment?.razorpayPaymentId ? (
          <Fact label="Payment reference" valueClassName="text-ink-soft">
            <span className="break-all font-mono text-[13px]">
              {order.payment.razorpayPaymentId}
            </span>
          </Fact>
        ) : null}
      </dl>

      <OrderReceipt order={order} />

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/shop" variant="emphasis" size="md">
          Continue shopping
        </ButtonLink>
        <ButtonLink href="/collections" variant="outline" size="md">
          Browse collections
        </ButtonLink>
      </div>
    </div>
  );
}

/** Items beside totals — the same receipt split checkout closes with. */
function OrderReceipt({ order }: { order: OrderDetailResponse }) {
  return (
    <div className={cn(checkoutLayout.panel, "mt-8")}>
      <div className={checkoutLayout.panelSplit}>
        <ul className="divide-y divide-ink/[0.07]">
          {order.items.map((item) => {
            const href = orderItemHref(item);
            return (
            <li
              key={item.id}
              className="flex justify-between gap-4 py-3 text-sm first:pt-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  {href ? (
                    <Link
                      href={href}
                      className="underline decoration-transparent decoration-1 underline-offset-[3px] transition-colors duration-200 hover:decoration-ink/40"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    item.productName
                  )}
                </p>
                <p className="mt-0.5 font-mono text-label-sm uppercase text-ink-faint">
                  {item.sizeMl} ml · Qty {item.quantity}
                  {item.kind === "bespoke" ? " · Bespoke" : ""}
                </p>
              </div>
              <p className="shrink-0 tabular-nums text-ink">
                {formatPaise(item.lineTotalPaise)}
              </p>
            </li>
            );
          })}
        </ul>

        <div className={checkoutLayout.panelAside}>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums text-ink">
                {formatPaise(order.subtotalPaise)}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="tabular-nums text-ink">
                {formatPaise(order.shippingPaise)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-t border-ink/10 pt-3">
              <dt className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
                Total
              </dt>
              <dd className="font-display text-lg font-semibold tabular-nums tracking-[-0.01em] text-ink">
                {formatPaise(order.totalPaise)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  valueClassName,
  children,
}: {
  label: string;
  valueClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-label-sm uppercase text-ink-faint">
        {label}
      </dt>
      <dd className={cn("mt-1.5 leading-relaxed text-ink", valueClassName)}>
        {children}
      </dd>
    </div>
  );
}

export function OrderUnavailableScreen() {
  return (
    <div className="max-w-lg py-6">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
        Order not available
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        We couldn’t find this order on your account. The link may be incorrect,
        or it may belong to a different one.
      </p>
      <div className="mt-8">
        <ButtonLink href="/shop" variant="outline" size="md">
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
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
        Couldn’t load order
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Something went wrong on our side. Your order is safe — please try again
        in a moment.
      </p>
      <Button
        type="button"
        variant="outline"
        size="md"
        className="mt-8 cursor-pointer"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}
