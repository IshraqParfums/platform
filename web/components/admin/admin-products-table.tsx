"use client";

import type { AdminProductListItem } from "@ishraqparfums/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatPaise } from "@/lib/format/money";

const SKELETON_WIDTHS = ["55%", "28%", "18%", "32%"];

const STATUS_TONE: Record<
  AdminProductListItem["status"],
  "neutral" | "gold" | "sage" | "rose"
> = {
  DRAFT: "neutral",
  ACTIVE: "sage",
  ARCHIVED: "gold",
  DELETED: "rose",
};

const columns: ColumnDef<AdminProductListItem>[] = [
  {
    id: "name",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-ink">{row.original.name}</p>
        <p className="text-xs text-ink-faint">{row.original.collectionName}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge tone={STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  {
    id: "variants",
    header: "Variants",
    cell: ({ row }) => row.original.variantCount,
  },
  {
    id: "price",
    header: "From",
    cell: ({ row }) =>
      row.original.fromPricePaise != null
        ? formatPaise(row.original.fromPricePaise)
        : "—",
  },
];

export function AdminProductsTable({
  products,
}: {
  products: AdminProductListItem[];
}) {
  const router = useRouter();
  const { isPending } = useAdminListPending();

  return (
    <DataTable
      columns={columns}
      data={products}
      loading={isPending}
      skeletonColumnWidths={SKELETON_WIDTHS}
      onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
      emptyMessage="No products match these filters."
    />
  );
}
