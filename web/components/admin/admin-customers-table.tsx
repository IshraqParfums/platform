"use client";

import type { AdminCustomerSummary } from "@ishraqparfums/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { DataTable } from "@/components/ui/data-table";
import { formatOrderDate } from "@/lib/orders/order-status";

const SKELETON_WIDTHS = ["45%", "50%", "18%", "32%"];

const columns: ColumnDef<AdminCustomerSummary>[] = [
  {
    id: "name",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-ink">{row.original.name ?? "Unnamed"}</p>
        <p className="text-xs text-ink-faint">{row.original.phone}</p>
      </div>
    ),
  },
  {
    id: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "—",
  },
  {
    id: "orders",
    header: "Orders",
    cell: ({ row }) => row.original.orderCount,
  },
  {
    id: "joined",
    header: "Joined",
    cell: ({ row }) => formatOrderDate(row.original.createdAt),
  },
];

export function AdminCustomersTable({
  customers,
}: {
  customers: AdminCustomerSummary[];
}) {
  const router = useRouter();
  const { isPending } = useAdminListPending();

  return (
    <DataTable
      columns={columns}
      data={customers}
      loading={isPending}
      skeletonColumnWidths={SKELETON_WIDTHS}
      onRowClick={(customer) => router.push(`/admin/customers/${customer.id}`)}
      emptyMessage="No customers match this search."
    />
  );
}
