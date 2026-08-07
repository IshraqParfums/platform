import type { AdminLowStockVariant } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminListShell } from "@/components/admin/admin-list-shell";
import { LowStockTable } from "@/components/admin/low-stock-table";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "Low stock" };

export default async function AdminLowStockPage({
  searchParams,
}: {
  searchParams: Promise<{ threshold?: string }>;
}) {
  const params = await searchParams;
  const threshold = Math.max(0, Number(params.threshold) || 5);
  const query = new URLSearchParams({ threshold: String(threshold) });

  const rows = await adminPageFetch<AdminLowStockVariant[]>(
    `/admin/products/low-stock?${query.toString()}`,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AdminBackLink href="/admin/products">Back to products</AdminBackLink>
      </div>

      <AdminListShell
        title="Low stock"
        subtitle={`Available variants with stock ≤ ${threshold}.`}
      >
        <LowStockTable rows={rows} />
      </AdminListShell>
    </div>
  );
}
