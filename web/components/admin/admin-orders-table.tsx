"use client";

import type { AdminOrderSummary } from "@ishraqparfums/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { AdminOrderStatusChip } from "@/components/admin/admin-order-status-chip";
import { DataTable } from "@/components/ui/data-table";
import { formatPaise } from "@/lib/format/money";
import { formatOrderDate, orderReference } from "@/lib/orders/order-status";

const SKELETON_WIDTHS = ["28%", "42%", "32%", "18%", "30%", "36%"];

const columns: ColumnDef<AdminOrderSummary>[] = [
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => (
      <span className="font-medium text-ink">{orderReference(row.original.id)}</span>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customerName,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <AdminOrderStatusChip status={row.original.status} />,
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => row.original.itemCount,
  },
  {
    id: "total",
    header: "Total",
    cell: ({ row }) => formatPaise(row.original.totalPaise),
  },
  {
    id: "placed",
    header: "Placed",
    cell: ({ row }) => formatOrderDate(row.original.createdAt),
  },
];

export function AdminOrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  const router = useRouter();
  const { isPending } = useAdminListPending();

  return (
    <DataTable
      columns={columns}
      data={orders}
      loading={isPending}
      skeletonColumnWidths={SKELETON_WIDTHS}
      onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      emptyMessage="No orders match these filters."
    />
  );
}
