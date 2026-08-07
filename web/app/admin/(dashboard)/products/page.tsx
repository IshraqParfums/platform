import type {
  AdminCollectionResponse,
  AdminProductListItem,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { AdminListShell } from "@/components/admin/admin-list-shell";
import { AdminPaginationNav } from "@/components/admin/admin-pagination-nav";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { ProductsFilterBar } from "@/components/admin/products-filter-bar";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    collectionId?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  // Default Active when status omitted; `all` opts out of the status filter.
  const statusFilter =
    params.status === undefined || params.status === ""
      ? "ACTIVE"
      : params.status;

  const query = new URLSearchParams();
  if (statusFilter !== "all") query.set("status", statusFilter);
  if (params.collectionId) query.set("collectionId", params.collectionId);
  if (params.search) query.set("search", params.search);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));

  const [products, collections] = await Promise.all([
    adminPageFetch<PaginatedResponse<AdminProductListItem>>(
      `/admin/products?${query.toString()}`,
    ),
    adminPageFetch<AdminCollectionResponse[]>("/admin/collections"),
  ]);

  const paginationQuery: Record<string, string> = {};
  if (params.status === "all") paginationQuery.status = "all";
  else if (statusFilter !== "ACTIVE" || params.status) {
    paginationQuery.status = statusFilter;
  } else {
    paginationQuery.status = "ACTIVE";
  }
  if (params.collectionId) paginationQuery.collectionId = params.collectionId;
  if (params.search) paginationQuery.search = params.search;

  return (
    <AdminListShell title="Products" subtitle={`${products.total} total.`}>
      <ProductsFilterBar
        status={statusFilter}
        collectionId={params.collectionId}
        search={params.search}
        collections={collections}
      />

      <AdminProductsTable products={products.items} />

      <AdminPaginationNav
        page={products.page}
        pageSize={products.pageSize}
        total={products.total}
        pathname="/admin/products"
        query={paginationQuery}
        compact
      />
    </AdminListShell>
  );
}
