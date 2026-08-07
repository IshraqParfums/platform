"use client";

import type { OrderStatus } from "@ishraqparfums/shared";
import { useEffect, useState } from "react";
import { AdminOrderStatusChip } from "@/components/admin/admin-order-status-chip";
import { OrderStatusAdvanceButton } from "@/components/admin/order-status-advance-button";

/** Keeps status chip and advance CTA in sync with optimistic updates. */
export function OrderStatusToolbar({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [current, setCurrent] = useState(status);

  useEffect(() => {
    setCurrent(status);
  }, [status]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AdminOrderStatusChip status={current} showHelp />
      <OrderStatusAdvanceButton
        orderId={orderId}
        status={current}
        onStatusChange={setCurrent}
      />
    </div>
  );
}
