"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { OrderDetail, OrderStatus } from "@ishraqparfums/shared";
import { ButtonLink } from "@/components/ui/button";
import { isShopAuthenticated } from "@/lib/auth/shop-session";
import { getOrder } from "@/lib/orders/orders-client";
import { formatPaise } from "@/lib/format/money";

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Awaiting payment";
    case "ORDER_RECEIVED":
    case "CONFIRMED":
      return "Order confirmed";
    case "IN_PRODUCTION":
      return "In production";
    case "READY_FOR_DISPATCH":
      return "Ready for dispatch";
    case "DISPATCHED":
      return "Dispatched";
    case "DELIVERED":
      return "Delivered";
    case "FAILED":
      return "Payment failed";
    case "EXPIRED":
      return "Expired";
    case "NEEDS_REVIEW":
      return "Under review";
    default:
      return status;
  }
}

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<"auth" | "not-found" | "load" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const authenticated = await isShopAuthenticated();
        if (!authenticated) {
          setError("auth");
          router.replace(
            `/login?next=${encodeURIComponent(`/orders/${orderId}`)}`,
          );
          return;
        }

        const detail = await getOrder(orderId);
        setOrder(detail);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (/not found|404/i.test(message)) {
          setError("not-found");
        } else {
          setError("load");
        }
      }
    });
  }, [orderId, router]);

  if (error === "auth" || (isPending && !order && !error)) {
    return (
      <div className="py-16">
        <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Loading order…
        </p>
      </div>
    );
  }

  if (error === "not-found") {
    return (
      <div className="max-w-lg py-10">
        <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
          Order not found
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          We couldn’t find this order. It may belong to another account, or the
          link may be incorrect.
        </p>
        <div className="mt-8">
          <ButtonLink href="/shop" variant="emphasis" size="md">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (error === "load" || !order) {
    return (
      <div className="max-w-lg py-10">
        <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
          Couldn’t load order
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Please try again in a moment.
        </p>
        <div className="mt-8">
          <ButtonLink href="/shop" variant="outline" size="md">
            Back to shop
          </ButtonLink>
        </div>
      </div>
    );
  }

  const address = order.shippingAddress;
  const paid =
    order.payment?.status === "PAID" ||
    (order.status !== "PENDING_PAYMENT" &&
      order.status !== "FAILED" &&
      order.status !== "EXPIRED");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        {statusLabel(order.status)}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
        {paid ? "Thank you" : "Order details"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        {paid
          ? "Your payment was received. We’ll keep you updated as your order moves forward."
          : "Here’s where things stand with this order."}
      </p>

      <dl className="mt-8 grid gap-4 border-y border-ink/[0.08] py-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            Order
          </dt>
          <dd className="mt-1 font-medium text-ink">{order.id}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            Total
          </dt>
          <dd className="mt-1 font-medium tabular-nums text-ink">
            {formatPaise(order.totalPaise)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            Contact
          </dt>
          <dd className="mt-1 text-ink">
            {order.customerName}
            <br />
            <span className="text-ink-soft">{order.customerEmail}</span>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            Ship to
          </dt>
          <dd className="mt-1 text-ink-soft">
            {address.name}
            <br />
            {address.line1}
            {address.line2 ? (
              <>
                <br />
                {address.line2}
              </>
            ) : null}
            <br />
            {address.city}, {address.state} {address.pincode}
            <br />
            {address.phone}
          </dd>
        </div>
      </dl>

      <h2 className="mt-10 font-display text-xl font-semibold tracking-[-0.015em] text-ink">
        Items
      </h2>
      <ul className="mt-4 divide-y divide-ink/[0.07] border-y border-ink/[0.07]">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-4 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-ink">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="hover:underline"
                >
                  {item.productName}
                </Link>
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {item.sizeMl} ml · Qty {item.quantity}
                {item.kind === "bespoke" ? " · Bespoke" : ""}
              </p>
            </div>
            <p className="shrink-0 tabular-nums text-ink">
              {formatPaise(item.lineTotalPaise)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-3 text-sm">
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
        <div className="flex justify-between gap-6 border-t border-ink/10 pt-3">
          <dt className="font-display text-lg font-semibold text-ink">Total</dt>
          <dd className="font-display text-lg font-semibold tabular-nums text-ink">
            {formatPaise(order.totalPaise)}
          </dd>
        </div>
      </dl>

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
