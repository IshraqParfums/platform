import type {
  OrderDetail,
  OrderItemResponse,
  OrderStatus,
  OrderSummary,
} from "../order/order-contracts.js";

export interface AdminOrderSummary extends OrderSummary {
  customerId: string;
  customerPhone: string;
}

/** Admin-only — includes formula snapshot for bespoke fulfillment. */
export interface AdminOrderItemResponse extends OrderItemResponse {
  formulaJson?: unknown;
}

export interface AdminOrderDetail extends Omit<OrderDetail, "items"> {
  customerId: string;
  customerPhone: string;
  items: AdminOrderItemResponse[];
}

export interface UpdateOrderStatusBody {
  status: OrderStatus;
}

/**
 * V1 fulfillment pipeline — admin-driven, strictly forward, no cancellation.
 * Starts at NEEDS_REVIEW (payment landed, admin must accept) then advances
 * through warehouse fulfillment. Single source of truth for both the API's
 * transition guard and the admin UI's "advance to next status" action.
 */
export const ORDER_FULFILLMENT_SEQUENCE: OrderStatus[] = [
  "NEEDS_REVIEW",
  "ORDER_RECEIVED",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
];

/**
 * Admin order list filter groups. `active` is the fulfillment queue;
 * `payment` covers unpaid / failed / expired checkouts;
 * `payment_failed` is failed+expired only (soft-merged label in the UI).
 */
export const ADMIN_ORDER_STATUS_GROUPS = {
  all: null,
  active: [...ORDER_FULFILLMENT_SEQUENCE],
  payment: ["PENDING_PAYMENT", "FAILED", "EXPIRED"],
  payment_failed: ["FAILED", "EXPIRED"],
} as const satisfies Record<string, readonly OrderStatus[] | null>;

export type AdminOrderStatusGroup = keyof typeof ADMIN_ORDER_STATUS_GROUPS;

export const ADMIN_ORDER_STATUS_GROUP_IDS = Object.keys(
  ADMIN_ORDER_STATUS_GROUPS,
) as AdminOrderStatusGroup[];

export function isAdminOrderStatusGroup(
  value: string,
): value is AdminOrderStatusGroup {
  return value in ADMIN_ORDER_STATUS_GROUPS;
}

export function statusesForAdminOrderGroup(
  group: AdminOrderStatusGroup,
): readonly OrderStatus[] | null {
  return ADMIN_ORDER_STATUS_GROUPS[group];
}

/** Queue tabs only — payment_failed is a drill-down under Payment issues. */
export const ADMIN_ORDER_QUEUE_GROUP_IDS = [
  "all",
  "active",
  "payment",
] as const satisfies readonly AdminOrderStatusGroup[];

export const ADMIN_ORDER_STATUS_GROUP_LABELS: Record<
  AdminOrderStatusGroup,
  string
> = {
  all: "All",
  active: "Active",
  payment: "Payment issues",
  payment_failed: "Payment failed",
};
