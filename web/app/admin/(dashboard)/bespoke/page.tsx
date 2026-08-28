import type {
  BespokeAdminListItem,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
} from "@ishraqparfums/shared";
import { AdminListShell } from "@/components/admin/admin-list-shell";
import { AdminPaginationNav } from "@/components/admin/admin-pagination-nav";
import { ButtonLink } from "@/components/ui/button";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { formatOrderDateTime } from "@/lib/orders/order-status";

export const metadata: Metadata = { title: "Bespoke" };

const PAGE_SIZE = 20;

export default async function AdminBespokeListPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    includeDeleted?: string;
    customerId?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const includeDeleted = params.includeDeleted === "1";
  const customerId = params.customerId?.trim() || undefined;

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));
  if (includeDeleted) query.set("includeDeleted", "true");
  if (customerId) query.set("customerId", customerId);

  const data = await adminPageFetch<PaginatedResponse<BespokeAdminListItem>>(
    `/admin/bespoke?${query.toString()}`,
  );

  const paginationQuery: Record<string, string> = {};
  if (includeDeleted) paginationQuery.includeDeleted = "1";
  if (customerId) paginationQuery.customerId = customerId;

  const listHref = (opts: { includeDeleted?: boolean }) => {
    const q = new URLSearchParams();
    if (opts.includeDeleted) q.set("includeDeleted", "1");
    if (customerId) q.set("customerId", customerId);
    const qs = q.toString();
    return qs ? `/admin/bespoke?${qs}` : "/admin/bespoke";
  };

  return (
    <AdminListShell
      title="Bespoke blends"
      subtitle={
        customerId
          ? `${data.total} formula${data.total === 1 ? "" : "s"} for this customer.`
          : `${data.total} saved formulas.`
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/bespoke/analytics" variant="outline" size="sm">
            Analytics
          </ButtonLink>
          <ButtonLink
            href={listHref({ includeDeleted: !includeDeleted })}
            variant="outline"
            size="sm"
          >
            {includeDeleted ? "Hide deleted" : "Include deleted"}
          </ButtonLink>
          {customerId ? (
            <ButtonLink href="/admin/bespoke" variant="ghost" size="sm">
              All customers
            </ButtonLink>
          ) : null}
        </div>
      }
    >
      <div className="overflow-x-auto rounded-lg border border-ink/10 bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 font-mono text-label-sm uppercase text-ink-faint">
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Family</th>
              <th className="px-3 py-2.5 font-medium">Created</th>
              <th className="px-3 py-2.5 font-medium">
                <span className="sr-only">Composition</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr
                key={row.id}
                className="border-b border-ink/[0.06] last:border-0"
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/bespoke/${row.id}`}
                    className="font-medium text-ink underline decoration-transparent underline-offset-[3px] hover:decoration-ink/40"
                  >
                    {row.name}
                  </Link>
                  {row.bottleName ? (
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {row.bottleName}
                      {row.sampleName ? ` · sample ${row.sampleName}` : ""}
                    </p>
                  ) : null}
                  {row.deletedAt ? (
                    <span className="mt-1 inline-block text-xs text-rose">
                      Deleted
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-ink-soft">
                  {row.customerId ? (
                    <Link
                      href={`/admin/customers/${row.customerId}`}
                      className="hover:text-ink hover:underline"
                    >
                      {row.customerName ?? row.customerPhone}
                    </Link>
                  ) : (
                    <span className="text-ink-faint">Guest</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.familyPrimary ? (
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            BESPOKE_FAMILY_COLOR[row.familyPrimary],
                        }}
                      />
                      {BESPOKE_DIMENSION_LABEL[row.familyPrimary]}
                      {row.familySecondary
                        ? ` / ${BESPOKE_DIMENSION_LABEL[row.familySecondary]}`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-ink-faint">
                  {formatOrderDateTime(row.createdAt)}
                </td>
                <td className="px-3 py-3 text-right">
                  <Link
                    href={`/admin/bespoke/${row.id}`}
                    className="font-mono text-label-sm uppercase text-gold-deeper hover:text-ink"
                  >
                    Composition
                  </Link>
                </td>
              </tr>
            ))}
            {data.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-ink-faint"
                >
                  No blends yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminPaginationNav
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        pathname="/admin/bespoke"
        query={paginationQuery}
        compact
      />
    </AdminListShell>
  );
}
