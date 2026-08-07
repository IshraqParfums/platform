"use client";

import type { AdminTopProduct } from "@ishraqparfums/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { formatPaise } from "@/lib/format/money";

const columns: ColumnDef<AdminTopProduct>[] = [
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-ink">{row.original.productName}</p>
        <p className="text-xs text-ink-faint">
          {row.original.sizeMl != null ? `${row.original.sizeMl} ml` : "Custom"}
        </p>
      </div>
    ),
  },
  {
    id: "qty",
    header: "Units sold",
    cell: ({ row }) => row.original.quantitySold,
  },
  {
    id: "revenue",
    header: "Revenue",
    cell: ({ row }) => formatPaise(row.original.revenuePaise),
  },
];

export function TopProductsTable({ items }: { items: AdminTopProduct[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={items}
      onRowClick={(item) => {
        if (!item.productId) return;
        router.push(`/admin/products/${item.productId}`);
      }}
      emptyMessage="No sales in this range yet."
    />
  );
}
