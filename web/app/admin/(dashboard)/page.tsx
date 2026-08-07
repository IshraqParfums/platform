import type {
  AdminAnalyticsOverview,
  AdminOrderStatusBreakdownResponse,
  AdminOrderSummary,
  AdminRevenueSeriesResponse,
  AdminTopProductsResponse,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import { ORDER_FULFILLMENT_SEQUENCE } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardRecentOrders } from "@/components/admin/dashboard-recent-orders";
import { DashboardTopProducts } from "@/components/admin/dashboard-top-products";
import { RangePicker } from "@/components/admin/range-picker";
import { ChartLine } from "@/components/ui/chart-line";
import { StatTile } from "@/components/ui/stat-tile";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { parseAnalyticsRange } from "@/lib/admin/analytics-range";
import { toRevenuePoints } from "@/lib/admin/analytics-view";
import { formatPaise } from "@/lib/format/money";
import { adminOrderStatusLabel } from "@/lib/orders/admin-order-status";

export const metadata: Metadata = { title: "Dashboard" };

const RECENT_ORDERS_LIMIT = 8;
const TOP_PRODUCTS_PREVIEW = 5;
const TOP_PRODUCTS_FETCH = 15;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseAnalyticsRange(params.range);

  const [overview, revenueSeries, statusBreakdown, topProducts, recentOrders] =
    await Promise.all([
      adminPageFetch<AdminAnalyticsOverview>(
        `/admin/analytics/overview?range=${range}`,
      ),
      adminPageFetch<AdminRevenueSeriesResponse>(
        `/admin/analytics/revenue-series?range=${range}`,
      ),
      adminPageFetch<AdminOrderStatusBreakdownResponse>(
        `/admin/analytics/order-status-breakdown?range=${range}`,
      ),
      adminPageFetch<AdminTopProductsResponse>(
        `/admin/analytics/top-products?range=${range}&limit=${TOP_PRODUCTS_FETCH}`,
      ),
      adminPageFetch<PaginatedResponse<AdminOrderSummary>>(
        `/admin/orders?statusGroup=active&pageSize=${RECENT_ORDERS_LIMIT}`,
      ),
    ]);

  const revenuePoints = toRevenuePoints(revenueSeries.points);
  const countByStatus = new Map(
    statusBreakdown.items.map((item) => [item.status, item.count]),
  );
  const statusRows = ORDER_FULFILLMENT_SEQUENCE.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
    label: adminOrderStatusLabel(status),
  })).filter((row) => row.count > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Revenue, orders and store health at a glance.
          </p>
        </div>
        <RangePicker basePath="/admin" active={range} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile
          label="Revenue"
          value={formatPaise(overview.revenuePaise)}
          sublabel={`${overview.orderCount} orders`}
        />
        <StatTile
          label="Avg order value"
          value={formatPaise(overview.averageOrderValuePaise)}
        />
        <StatTile
          label="New customers"
          value={overview.newCustomerCount}
          sublabel={
            overview.returningCustomerCount > 0
              ? `${overview.returningCustomerCount} returning buyers this period`
              : "First-time paid buyers in this range"
          }
        />
        <StatTile
          label="Orders to accept"
          value={
            <Link
              href="/admin/orders?status=NEEDS_REVIEW"
              className="hover:text-gold-deep"
            >
              {overview.needsReviewCount}
            </Link>
          }
          sublabel="Paid but stuck before fulfillment"
        />
        <StatTile
          label="Low stock"
          value={
            <Link
              href="/admin/products/low-stock"
              className="hover:text-gold-deep"
            >
              {overview.lowStockCount}
            </Link>
          }
          sublabel="Variants at or below threshold"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">
            Revenue
          </h2>
          <div className="mt-4">
            {revenuePoints.length > 0 ? (
              <ChartLine data={revenuePoints} valueFormat="paise" />
            ) : (
              <p className="py-10 text-center text-sm text-ink-faint">
                No revenue in this range yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Fulfillment
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {statusRows.length === 0 ? (
              <li className="py-6 text-center text-sm text-ink-faint">
                No active orders in this range.
              </li>
            ) : (
              statusRows.map((row) => (
                <li key={row.status}>
                  <Link
                    href={`/admin/orders?status=${row.status}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-ink/[0.04]"
                  >
                    <span className="text-ink-soft">{row.label}</span>
                    <span className="font-medium text-ink">{row.count}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-ink/10 bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Recent orders
            </h2>
            <Link
              href="/admin/orders?statusGroup=active"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              View all
            </Link>
          </div>
          <div className="mt-4">
            <DashboardRecentOrders orders={recentOrders.items} />
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Top products
          </h2>
          <div className="mt-4">
            <DashboardTopProducts
              items={topProducts.items}
              previewCount={TOP_PRODUCTS_PREVIEW}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
