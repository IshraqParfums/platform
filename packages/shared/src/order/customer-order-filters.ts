import type { OrderStatus } from "./order-contracts.js";

/**
 * Customer order history chips. One group id → Nest statuses.
 * Keep API + storefront in sync via this map only.
 */
export const CUSTOMER_ORDER_STATUS_GROUPS = {
  all: null,
  awaiting: ["PENDING_PAYMENT", "NEEDS_REVIEW"],
  confirmed: ["ORDER_RECEIVED", "CONFIRMED"],
  in_production: ["IN_PRODUCTION", "READY_FOR_DISPATCH"],
  dispatched: ["DISPATCHED"],
  delivered: ["DELIVERED"],
  failed: ["FAILED", "EXPIRED"],
} as const satisfies Record<string, readonly OrderStatus[] | null>;

export type CustomerOrderStatusGroup =
  keyof typeof CUSTOMER_ORDER_STATUS_GROUPS;

export const CUSTOMER_ORDER_STATUS_GROUP_IDS = Object.keys(
  CUSTOMER_ORDER_STATUS_GROUPS,
) as CustomerOrderStatusGroup[];

export function isCustomerOrderStatusGroup(
  value: string,
): value is CustomerOrderStatusGroup {
  return value in CUSTOMER_ORDER_STATUS_GROUPS;
}

export function statusesForCustomerOrderGroup(
  group: CustomerOrderStatusGroup,
): readonly OrderStatus[] | null {
  return CUSTOMER_ORDER_STATUS_GROUPS[group];
}

/** Chip labels for the storefront (not required by Nest). */
export const CUSTOMER_ORDER_STATUS_GROUP_LABELS: Record<
  CustomerOrderStatusGroup,
  string
> = {
  all: "All",
  awaiting: "Awaiting payment",
  confirmed: "Order confirmed",
  in_production: "In production",
  dispatched: "Dispatched",
  delivered: "Delivered",
  failed: "Failed",
};

export type CustomerOrderStatusCounts = Record<
  CustomerOrderStatusGroup,
  number
>;

export function emptyCustomerOrderStatusCounts(): CustomerOrderStatusCounts {
  return {
    all: 0,
    awaiting: 0,
    confirmed: 0,
    in_production: 0,
    dispatched: 0,
    delivered: 0,
    failed: 0,
  };
}

/**
 * Roll raw `groupBy status` rows into chip counts. `all` is the sum of every
 * status (including any unexpected ones).
 */
export function countsFromStatusRows(
  rows: ReadonlyArray<{ status: OrderStatus; count: number }>,
): CustomerOrderStatusCounts {
  const counts = emptyCustomerOrderStatusCounts();
  const byStatus = new Map<OrderStatus, number>();

  for (const row of rows) {
    byStatus.set(row.status, row.count);
    counts.all += row.count;
  }

  for (const group of CUSTOMER_ORDER_STATUS_GROUP_IDS) {
    if (group === "all") continue;
    const statuses = CUSTOMER_ORDER_STATUS_GROUPS[group];
    if (!statuses) continue;
    counts[group] = statuses.reduce(
      (sum, status) => sum + (byStatus.get(status) ?? 0),
      0,
    );
  }

  return counts;
}
