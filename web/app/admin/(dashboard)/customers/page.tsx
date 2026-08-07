import {
  ADMIN_CUSTOMER_LIST_SORT_DEFAULT,
  isAdminCustomerListSort,
  type AdminCustomerListSort,
  type AdminCustomerSummary,
  type PaginatedResponse,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { AdminCustomersTable } from "@/components/admin/admin-customers-table";
import { AdminListShell } from "@/components/admin/admin-list-shell";
import { AdminPaginationNav } from "@/components/admin/admin-pagination-nav";
import { CustomersSearchBar } from "@/components/admin/customers-search-bar";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort: AdminCustomerListSort = isAdminCustomerListSort(params.sort)
    ? params.sort
    : ADMIN_CUSTOMER_LIST_SORT_DEFAULT;

  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (sort !== ADMIN_CUSTOMER_LIST_SORT_DEFAULT) query.set("sort", sort);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));

  const customers = await adminPageFetch<PaginatedResponse<AdminCustomerSummary>>(
    `/admin/customers?${query.toString()}`,
  );

  const paginationQuery: Record<string, string> = {};
  if (params.search) paginationQuery.search = params.search;
  if (sort !== ADMIN_CUSTOMER_LIST_SORT_DEFAULT) paginationQuery.sort = sort;

  return (
    <AdminListShell title="Customers" subtitle={`${customers.total} total.`}>
      <CustomersSearchBar search={params.search} sort={sort} />

      <AdminCustomersTable customers={customers.items} />

      <AdminPaginationNav
        page={customers.page}
        pageSize={customers.pageSize}
        total={customers.total}
        pathname="/admin/customers"
        query={paginationQuery}
        compact
      />
    </AdminListShell>
  );
}
