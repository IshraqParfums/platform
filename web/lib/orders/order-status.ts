import type { OrderStatus } from "@ishraqparfums/shared";
import {
  CUSTOMER_ORDER_STATUS_GROUP_IDS,
  CUSTOMER_ORDER_STATUS_GROUP_LABELS,
  CUSTOMER_ORDER_STATUS_GROUPS,
  type CustomerOrderStatusGroup,
} from "@ishraqparfums/shared";

/**
 * Customer-facing wording for an order's state. Shared by the order list and
 * the order page so history and confirmation never describe the same order
 * with different words.
 *
 * `EXPIRED` reads as a failed payment: the distinction between "the window
 * lapsed" and "the payment was declined" is ours, not the customer's.
 */
export function orderStatusLabel(status: OrderStatus): string {
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
    case "EXPIRED":
      return "Payment failed";
    case "NEEDS_REVIEW":
      return "Under review";
    default:
      return status;
  }
}

export type OrderTone = "awaiting" | "active" | "completed" | "failed";

/** Chip tone for status badges — derived from the shared group map. */
export function orderTone(status: OrderStatus): OrderTone {
  for (const group of CUSTOMER_ORDER_STATUS_GROUP_IDS) {
    if (group === "all") continue;
    const statuses = CUSTOMER_ORDER_STATUS_GROUPS[group];
    if (!statuses) continue;
    if (!(statuses as readonly OrderStatus[]).includes(status)) continue;
    if (group === "awaiting" || group === "failed") return group;
    if (group === "delivered") return "completed";
    return "active";
  }
  return "active";
}

export function orderNeedsAttention(status: OrderStatus): boolean {
  const tone = orderTone(status);
  return tone === "awaiting" || tone === "failed";
}

/** Filters offered on the orders page — ids/labels from shared. */
export const ORDER_FILTERS = CUSTOMER_ORDER_STATUS_GROUP_IDS.map((id) => ({
  id,
  label: CUSTOMER_ORDER_STATUS_GROUP_LABELS[id],
}));

export type OrderFilterId = CustomerOrderStatusGroup;

const ORDER_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const ORDER_TIME = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatOrderDate(iso: string): string {
  const date = parse(iso);
  return date ? ORDER_DATE.format(date) : iso;
}

export function formatOrderDateTime(iso: string): string {
  const date = parse(iso);
  if (!date) return iso;
  return `${ORDER_DATE.format(date)} · ${ORDER_TIME.format(date)}`;
}

export function formatOrderTime(iso: string): string {
  const date = parse(iso);
  return date ? ORDER_TIME.format(date) : iso;
}

export function orderReference(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
