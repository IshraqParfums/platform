"use client";

import type { AdminOrderStatusGroup, OrderStatus } from "@ishraqparfums/shared";
import { usePathname } from "next/navigation";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { OrdersStatusGuide } from "@/components/admin/orders-status-guide";
import { Select } from "@/components/ui/select";
import {
  ADMIN_ACTIVE_STATUSES,
  ADMIN_ORDER_GROUP_FILTERS,
  adminOrderStatusLabel,
} from "@/lib/orders/admin-order-status";
import { cn } from "@/lib/cn";

type QueueTab = "all" | "active" | "payment";

function queueTabFromGroup(group: AdminOrderStatusGroup): QueueTab {
  if (group === "payment" || group === "payment_failed") return "payment";
  if (group === "all") return "all";
  return "active";
}

export function OrdersFilterBar({
  statusGroup,
  status,
}: {
  statusGroup: AdminOrderStatusGroup;
  status?: string;
}) {
  const { push } = useAdminListPending();
  const pathname = usePathname();
  const queueTab = queueTabFromGroup(statusGroup);

  function navigate(params: {
    statusGroup?: AdminOrderStatusGroup;
    status?: string;
  }) {
    const qs = new URLSearchParams();
    const group = params.statusGroup ?? statusGroup;
    if (params.status) {
      qs.set("status", params.status);
      qs.set(
        "statusGroup",
        group === "payment_failed" ? "payment" : group,
      );
    } else if (params.statusGroup) {
      qs.set("statusGroup", params.statusGroup);
    }
    push(`${pathname}?${qs.toString()}`);
  }

  const selectValue = (() => {
    if (status) return status;
    if (statusGroup === "payment_failed") return "payment_failed";
    return "";
  })();

  const statusOptions = (() => {
    if (queueTab === "active") {
      return [
        { value: "", label: "All active" },
        ...ADMIN_ACTIVE_STATUSES.map((value) => ({
          value,
          label: adminOrderStatusLabel(value),
        })),
      ];
    }
    if (queueTab === "payment") {
      return [
        { value: "", label: "All payment issues" },
        {
          value: "PENDING_PAYMENT",
          label: adminOrderStatusLabel("PENDING_PAYMENT"),
        },
        { value: "payment_failed", label: "Payment failed" },
      ];
    }
    const allStatuses: OrderStatus[] = [
      "PENDING_PAYMENT",
      "NEEDS_REVIEW",
      "ORDER_RECEIVED",
      "CONFIRMED",
      "IN_PRODUCTION",
      "READY_FOR_DISPATCH",
      "DISPATCHED",
      "DELIVERED",
    ];
    return [
      { value: "", label: "All statuses" },
      ...allStatuses.map((value) => ({
        value,
        label: adminOrderStatusLabel(value),
      })),
      { value: "payment_failed", label: "Payment failed" },
    ];
  })();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
      <div className="-mx-1 overflow-x-auto px-1 md:mx-0 md:overflow-visible md:px-0">
        <div
          role="group"
          aria-label="Order queue"
          className="inline-flex min-w-min items-center gap-1 rounded-full border border-ink/12 bg-card p-1"
        >
          {ADMIN_ORDER_GROUP_FILTERS.map((group) => {
            const selected = queueTab === group.id;
            return (
              <button
                key={group.id}
                type="button"
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-ink text-cream-soft"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                )}
                onClick={() => navigate({ statusGroup: group.id })}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:min-w-0">
        <Select
          value={selectValue}
          options={statusOptions}
          ariaLabel="Filter by status"
          className="w-full sm:w-[13.5rem] sm:shrink-0"
          triggerClassName="w-full truncate"
          onChange={(value) => {
            if (!value) {
              navigate({
                statusGroup:
                  queueTab === "payment"
                    ? "payment"
                    : queueTab === "all"
                      ? "all"
                      : "active",
              });
              return;
            }
            if (value === "payment_failed") {
              navigate({ statusGroup: "payment_failed" });
              return;
            }
            navigate({
              statusGroup:
                queueTab === "payment"
                  ? "payment"
                  : queueTab === "all"
                    ? "all"
                    : "active",
              status: value,
            });
          }}
        />
        <OrdersStatusGuide />
      </div>
    </div>
  );
}
