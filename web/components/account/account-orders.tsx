"use client";

import { useCallback, useState } from "react";
import type {
  CustomerOrderListResponse,
  OrderSummary,
} from "@ishraqparfums/shared";
import { emptyCustomerOrderStatusCounts } from "@ishraqparfums/shared";
import { AccountEmpty } from "@/components/account/account-section";
import { AccountError } from "@/components/account/account-screen";
import { OrdersListSkeleton } from "@/components/account/account-skeletons";
import { OrderCards } from "@/components/account/order-card";
import { OrderFilters } from "@/components/account/order-filters";
import { Button, ButtonLink } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ACCOUNT_ORDERS } from "@/lib/auth/account-routes";
import { useGuardedLoad } from "@/lib/auth/use-guarded-load";
import { listOrders } from "@/lib/orders/orders-client";
import {
  ORDER_FILTERS,
  type OrderFilterId,
} from "@/lib/orders/order-status";

const PAGE_SIZE = 50;

/**
 * Full order history. Filter + pagination are server-backed; `load` only fetches.
 */
export function AccountOrders() {
  const [filter, setFilter] = useState<OrderFilterId>("all");
  const [olderPages, setOlderPages] = useState<OrderSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    (): Promise<CustomerOrderListResponse> =>
      listOrders({ page: 1, pageSize: PAGE_SIZE, statusGroup: filter }),
    [filter],
  );

  const { state, data, reload } = useGuardedLoad(load, ACCOUNT_ORDERS);

  function resetPagination() {
    setOlderPages([]);
    setPage(1);
  }

  function onFilterChange(next: OrderFilterId) {
    if (next === filter) return;
    resetPagination();
    setFilter(next);
  }

  function onRetry() {
    resetPagination();
    reload();
  }

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const result = await listOrders({
        page: next,
        pageSize: PAGE_SIZE,
        statusGroup: filter,
      });
      setOlderPages((current) => [...current, ...result.items]);
      setPage(next);
    } catch {
      toast.error("Could not load more orders", "Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (state === "error") return <AccountError onRetry={onRetry} />;
  if (state === "loading" || !data) return <OrdersListSkeleton />;

  const orders = [...data.items, ...olderPages];
  const total = data.total;
  const counts = data.counts ?? emptyCustomerOrderStatusCounts();
  const hasMore = orders.length < total;
  const filterLabel =
    ORDER_FILTERS.find((option) => option.id === filter)?.label.toLowerCase() ??
    filter;

  return (
    <div>
      <header>
        <h1 className="font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
          Orders
        </h1>
        <p className="mt-2 font-mono text-label-sm uppercase text-ink-faint">
          {counts.all} {counts.all === 1 ? "order" : "orders"}
        </p>
      </header>

      {counts.all === 0 ? (
        <div className="mt-8 border-t border-ink/[0.08] pt-8">
          <AccountEmpty>
            Nothing ordered yet. When you do, every order will be here.
          </AccountEmpty>
          <ButtonLink href="/shop" variant="outline" size="md" className="mt-6">
            Browse perfumes
          </ButtonLink>
        </div>
      ) : (
        <>
          <OrderFilters
            className="mt-8"
            active={filter}
            counts={counts}
            onChange={onFilterChange}
          />

          <div className="mt-6">
            {orders.length === 0 ? (
              <AccountEmpty>
                No {filterLabel} orders — everything is under All.
              </AccountEmpty>
            ) : (
              <OrderCards orders={orders} />
            )}
          </div>

          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={loadingMore}
              className="mt-6 cursor-pointer"
              onClick={() => {
                void loadMore();
              }}
            >
              {loadingMore ? "Loading…" : "Show older orders"}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
