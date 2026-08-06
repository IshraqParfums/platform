"use client";

import Link from "next/link";
import type { OrderSummary } from "@ishraqparfums/shared";
import { OrderStatusChip } from "@/components/account/order-status-chip";
import { accountOrderPath } from "@/lib/auth/account-routes";
import { formatPaise } from "@/lib/format/money";
import {
  formatOrderDateTime,
  orderReference,
} from "@/lib/orders/order-status";
import { cn } from "@/lib/cn";

/**
 * One order in history: when it was placed, its reference, where it has got to,
 * and what it cost. The whole card is the way in.
 *
 * A card rather than a flush row — an order is a thing you owned, and the
 * padding and border give it the same standing as an address card in checkout.
 */
export function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={accountOrderPath(order.id)}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-lg border border-ink/12 px-5 py-4",
        "transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)]",
        "hover:border-ink/25 hover:bg-card",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* The card is the link; the date underlines on hover to say so
            without putting a chevron on every line. */}
        <p className="text-[15px] font-medium text-ink underline decoration-transparent decoration-1 underline-offset-[3px] transition-colors duration-200 group-hover:decoration-ink/40">
          {formatOrderDateTime(order.createdAt)}
        </p>
        <p className="shrink-0 font-display text-lg font-semibold tabular-nums tracking-[-0.01em] text-ink">
          {formatPaise(order.totalPaise)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono text-label-sm uppercase text-ink-faint">
          {orderReference(order.id)}
          {" · "}
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </p>
        <OrderStatusChip status={order.status} />
      </div>
    </Link>
  );
}

export function OrderCards({ orders }: { orders: readonly OrderSummary[] }) {
  return (
    <ul className="grid gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} />
        </li>
      ))}
    </ul>
  );
}
