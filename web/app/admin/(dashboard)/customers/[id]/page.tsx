import type {
  AdminCustomerSummary,
  AdminOrderSummary,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { CustomerEditForm } from "@/components/admin/customer-edit-form";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { NestApiError } from "@/lib/api/errors";
import { formatOrderDate } from "@/lib/orders/order-status";

export const metadata: Metadata = { title: "Customer" };

type RouteParams = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: RouteParams) {
  const { id } = await params;

  let customer: AdminCustomerSummary;
  try {
    customer = await adminPageFetch<AdminCustomerSummary>(`/admin/customers/${id}`);
  } catch (error) {
    if (error instanceof NestApiError && (error.status === 404 || error.status === 400)) {
      notFound();
    }
    throw error;
  }

  const orders = await adminPageFetch<PaginatedResponse<AdminOrderSummary>>(
    `/admin/orders?customerId=${id}&pageSize=50`,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AdminBackLink href="/admin/customers">Back to customers</AdminBackLink>
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {customer.name ?? "Unnamed customer"}
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          Joined {formatOrderDate(customer.createdAt)} · {customer.orderCount} orders
        </p>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
        <div className="mt-4">
          <CustomerEditForm customer={customer} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Orders</h2>
        <AdminOrdersTable orders={orders.items} />
      </div>
    </div>
  );
}
