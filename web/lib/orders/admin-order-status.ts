import type { OrderStatus } from "@ishraqparfums/shared";
import {
  ADMIN_ORDER_QUEUE_GROUP_IDS,
  ADMIN_ORDER_STATUS_GROUP_LABELS,
  ORDER_FULFILLMENT_SEQUENCE,
  type AdminOrderStatusGroup,
} from "@ishraqparfums/shared";

/**
 * Admin-facing order status copy. Never reuse customer `orderStatusLabel` —
 * ops needs Received vs Confirmed. FAILED and EXPIRED both read as Payment failed.
 */
export function adminOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Pending payment";
    case "NEEDS_REVIEW":
      return "Needs review";
    case "ORDER_RECEIVED":
      return "Received";
    case "CONFIRMED":
      return "Confirmed";
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
    default:
      return status;
  }
}

export function adminOrderStatusHelp(status: OrderStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Checkout started; customer has not completed payment yet.";
    case "NEEDS_REVIEW":
      return "Payment succeeded. Accept the order to start fulfillment.";
    case "ORDER_RECEIVED":
      return "Accepted into the pipeline. Confirm when ready for production.";
    case "CONFIRMED":
      return "Confirmed for the workshop. Start production when work begins.";
    case "IN_PRODUCTION":
      return "Being made. Mark ready for dispatch when packed.";
    case "READY_FOR_DISPATCH":
      return "Packed and waiting to ship.";
    case "DISPATCHED":
      return "With the courier. Mark delivered when the customer receives it.";
    case "DELIVERED":
      return "Order completed.";
    case "FAILED":
    case "EXPIRED":
      return "Payment did not complete (declined or checkout window lapsed).";
    default:
      return status;
  }
}

/** Per-status chip visuals so Received ≠ Confirmed at a glance. */
export type AdminStatusVisual = {
  dot: string;
  chip: string;
};

export function adminOrderStatusVisual(status: OrderStatus): AdminStatusVisual {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        dot: "bg-rose-deep",
        chip: "border-rose-deep/25 bg-rose-deep/5 text-rose-deep",
      };
    case "NEEDS_REVIEW":
      return {
        dot: "bg-amber-600",
        chip: "border-amber-600/30 bg-amber-600/10 text-amber-900",
      };
    case "ORDER_RECEIVED":
      return {
        dot: "bg-sky-600",
        chip: "border-sky-600/25 bg-sky-600/8 text-sky-900",
      };
    case "CONFIRMED":
      return {
        dot: "bg-indigo-600",
        chip: "border-indigo-600/25 bg-indigo-600/8 text-indigo-900",
      };
    case "IN_PRODUCTION":
      return {
        dot: "bg-gold",
        chip: "border-gold/40 bg-gold/10 text-ink",
      };
    case "READY_FOR_DISPATCH":
      return {
        dot: "bg-teal-600",
        chip: "border-teal-600/25 bg-teal-600/8 text-teal-900",
      };
    case "DISPATCHED":
      return {
        dot: "bg-violet-600",
        chip: "border-violet-600/25 bg-violet-600/8 text-violet-900",
      };
    case "DELIVERED":
      return {
        dot: "bg-sage",
        chip: "border-sage/40 bg-sage/10 text-ink",
      };
    case "FAILED":
    case "EXPIRED":
      return {
        dot: "bg-rose-deep",
        chip: "border-rose-deep/30 bg-rose-deep/8 text-rose-deep",
      };
    default:
      return {
        dot: "bg-ink/40",
        chip: "border-ink/12 text-ink-soft",
      };
  }
}

/** Verb for advancing from `status` to the next fulfillment step. */
export function adminOrderAdvanceVerb(status: OrderStatus): string | null {
  const index = ORDER_FULFILLMENT_SEQUENCE.indexOf(status);
  if (index < 0 || index >= ORDER_FULFILLMENT_SEQUENCE.length - 1) {
    return null;
  }

  switch (status) {
    case "NEEDS_REVIEW":
      return "Accept order";
    case "ORDER_RECEIVED":
      return "Confirm order";
    case "CONFIRMED":
      return "Start production";
    case "IN_PRODUCTION":
      return "Mark ready for dispatch";
    case "READY_FOR_DISPATCH":
      return "Mark dispatched";
    case "DISPATCHED":
      return "Mark delivered";
    default:
      return null;
  }
}

/** Statuses offered inside the Active filter’s single-status select. */
export const ADMIN_ACTIVE_STATUSES: OrderStatus[] = [
  ...ORDER_FULFILLMENT_SEQUENCE,
];

export const ADMIN_ORDER_GROUP_FILTERS = ADMIN_ORDER_QUEUE_GROUP_IDS.map(
  (id) => ({
    id,
    label: ADMIN_ORDER_STATUS_GROUP_LABELS[id],
  }),
);

/** Queue tabs — copy for the orders status guide modal. */
export const ADMIN_ORDER_QUEUE_GUIDE = [
  {
    id: "active" as const,
    title: "Active",
    body: "Paid orders in the fulfillment queue. Work these from Needs review through Delivered.",
  },
  {
    id: "payment" as const,
    title: "Payment issues",
    body: "Checkout started but not paid — pending, declined, or expired. Not ready to fulfill.",
  },
  {
    id: "all" as const,
    title: "All",
    body: "Every order regardless of payment or fulfillment stage.",
  },
] as const;

/** Pipeline steps shown in the status guide (fulfillment sequence only). */
export const ADMIN_FULFILLMENT_GUIDE = ORDER_FULFILLMENT_SEQUENCE.map(
  (status) => ({
    status,
    label: adminOrderStatusLabel(status),
    help: adminOrderStatusHelp(status),
    action: adminOrderAdvanceVerb(status),
  }),
);

export type { AdminOrderStatusGroup };
