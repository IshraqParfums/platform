import type {
  AdminCustomerSummary,
  AdminOrderSummary,
  BespokeAdminListItem,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
} from "@ishraqparfums/shared";
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
    customer = await adminPageFetch<AdminCustomerSummary>(
      `/admin/customers/${id}`,
    );
  } catch (error) {
    if (
      error instanceof NestApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound();
    }
    throw error;
  }

  const [orders, blends] = await Promise.all([
    adminPageFetch<PaginatedResponse<AdminOrderSummary>>(
      `/admin/orders?customerId=${id}&pageSize=50`,
    ),
    adminPageFetch<PaginatedResponse<BespokeAdminListItem>>(
      `/admin/bespoke?customerId=${encodeURIComponent(id)}&pageSize=20`,
    ),
  ]);

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
          Joined {formatOrderDate(customer.createdAt)} · {customer.orderCount}{" "}
          orders
        </p>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
        <div className="mt-4">
          <CustomerEditForm customer={customer} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">
            Bespoke blends
          </h2>
          {blends.total > 0 ? (
            <Link
              href={`/admin/bespoke?customerId=${encodeURIComponent(id)}`}
              className="font-mono text-label-sm uppercase text-ink-soft hover:text-ink"
            >
              {blends.total > blends.items.length
                ? `All ${blends.total}`
                : "View in bespoke"}
            </Link>
          ) : null}
        </div>
        {blends.items.length === 0 ? (
          <p className="rounded-lg border border-ink/10 bg-card px-4 py-6 text-sm text-ink-faint">
            No saved bespoke formulas for this customer.
          </p>
        ) : (
          <ul className="grid gap-2">
            {blends.items.map((brew) => (
              <li key={brew.id}>
                <Link
                  href={`/admin/bespoke/${brew.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/12 bg-card px-4 py-3 transition-colors hover:border-ink/25 hover:bg-cream-soft"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{brew.name}</p>
                    <p className="mt-0.5 font-mono text-label-sm uppercase text-ink-faint">
                      {brew.familyPrimary
                        ? BESPOKE_DIMENSION_LABEL[brew.familyPrimary]
                        : "Bespoke"}
                      {brew.familySecondary
                        ? ` · ${BESPOKE_DIMENSION_LABEL[brew.familySecondary]}`
                        : ""}
                    </p>
                  </div>
                  <span className="flex items-center gap-2">
                    {brew.familyPrimary ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            BESPOKE_FAMILY_COLOR[brew.familyPrimary],
                        }}
                        aria-hidden
                      />
                    ) : null}
                    <span className="font-mono text-label-sm uppercase text-gold-deeper">
                      Composition
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Orders
        </h2>
        <AdminOrdersTable orders={orders.items} />
      </div>
    </div>
  );
}
