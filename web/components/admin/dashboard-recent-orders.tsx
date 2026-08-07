"use client";

import type { AdminOrderSummary } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { AdminOrderStatusChip } from "@/components/admin/admin-order-status-chip";
import { formatPaise } from "@/lib/format/money";
import { formatOrderDate, orderReference } from "@/lib/orders/order-status";

export function DashboardRecentOrders({
  orders,
}: {
  orders: AdminOrderSummary[];
}) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-faint">No orders yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-ink-faint">
            <th className="py-2 pr-4 font-mono text-label-sm uppercase">
              Order
            </th>
            <th className="py-2 pr-4 font-mono text-label-sm uppercase">
              Customer
            </th>
            <th className="py-2 pr-4 font-mono text-label-sm uppercase">
              Status
            </th>
            <th className="py-2 pr-4 font-mono text-label-sm uppercase">
              Total
            </th>
            <th className="py-2 font-mono text-label-sm uppercase">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.03]"
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/admin/orders/${order.id}`);
                }
              }}
            >
              <td className="py-2.5 pr-4 font-medium text-ink">
                {orderReference(order.id)}
              </td>
              <td className="py-2.5 pr-4 text-ink-soft">{order.customerName}</td>
              <td className="py-2.5 pr-4">
                <AdminOrderStatusChip status={order.status} />
              </td>
              <td className="py-2.5 pr-4 text-ink">
                {formatPaise(order.totalPaise)}
              </td>
              <td className="py-2.5 text-ink-faint">
                {formatOrderDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
