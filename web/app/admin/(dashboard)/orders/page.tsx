import type {
  AdminOrderStatusGroup,
  AdminOrderSummary,
  OrderStatus,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import {
  ADMIN_ORDER_STATUS_GROUPS,
  isAdminOrderStatusGroup,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { AdminListShell } from "@/components/admin/admin-list-shell";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminPaginationNav } from "@/components/admin/admin-pagination-nav";
import { OrdersFilterBar } from "@/components/admin/orders-filter-bar";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 20;

function inferQueueForStatus(status: string): AdminOrderStatusGroup {
  const payment = ADMIN_ORDER_STATUS_GROUPS.payment as readonly OrderStatus[];
  if (payment.includes(status as OrderStatus)) return "payment";
  const active = ADMIN_ORDER_STATUS_GROUPS.active as readonly OrderStatus[];
  if (active.includes(status as OrderStatus)) return "active";
  return "all";
}

function resolveFilters(params: {
  status?: string;
  statusGroup?: string;
}): { statusGroup: AdminOrderStatusGroup; status?: string } {
  if (params.status) {
    const fromQuery =
      params.statusGroup && isAdminOrderStatusGroup(params.statusGroup)
        ? params.statusGroup === "payment_failed"
          ? "payment"
          : params.statusGroup
        : inferQueueForStatus(params.status);
    return { statusGroup: fromQuery, status: params.status };
  }
  if (params.statusGroup && isAdminOrderStatusGroup(params.statusGroup)) {
    return { statusGroup: params.statusGroup };
  }
  return { statusGroup: "active" };
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; statusGroup?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { statusGroup, status } = resolveFilters(params);

  const query = new URLSearchParams();
  if (status) query.set("status", status);
  else query.set("statusGroup", statusGroup);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));

  const orders = await adminPageFetch<PaginatedResponse<AdminOrderSummary>>(
    `/admin/orders?${query.toString()}`,
  );

  const paginationQuery: Record<string, string> = status
    ? { status, statusGroup }
    : { statusGroup };

  return (
    <AdminListShell title="Orders" subtitle={`${orders.total} total.`}>
      <OrdersFilterBar statusGroup={statusGroup} status={status} />

      <AdminOrdersTable orders={orders.items} />

      <AdminPaginationNav
        page={orders.page}
        pageSize={orders.pageSize}
        total={orders.total}
        pathname="/admin/orders"
        query={paginationQuery}
        compact
      />
    </AdminListShell>
  );
}
