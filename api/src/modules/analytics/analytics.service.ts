import { Injectable } from '@nestjs/common';
import type {
  AdminAnalyticsOverview,
  AdminOrderStatusBreakdownResponse,
  AdminRevenueSeriesResponse,
  AdminTopProductsResponse,
  AnalyticsRange,
} from '@ishraqparfums/shared';
import { OrderStatus } from '@prisma/client';
import { AnalyticsRepository } from './analytics.repository';

const RANGE_DAYS: Record<Exclude<AnalyticsRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function sinceForRange(range: AnalyticsRange, now = new Date()): Date | null {
  if (range === 'all') {
    return null;
  }
  const days = RANGE_DAYS[range];
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getOverview(
    range: AnalyticsRange,
    lowStockThreshold: number,
  ): Promise<AdminAnalyticsOverview> {
    const since = sinceForRange(range);

    const [
      { revenuePaise, orderCount },
      needsReviewCount,
      lowStockCount,
      firstPaidOrderDates,
      inRangeCustomerIds,
    ] = await Promise.all([
      this.repository.revenueAndOrderCount(since),
      this.repository.countNeedsReview(),
      this.repository.countLowStockVariants(lowStockThreshold),
      this.repository.firstPaidOrderDates(),
      this.repository.customerIdsWithPaidOrderSince(since),
    ]);

    let newCustomerCount = 0;
    let returningCustomerCount = 0;
    const rangeStart = since ?? new Date(0);

    for (const customerId of inRangeCustomerIds) {
      const firstPaidAt = firstPaidOrderDates.get(customerId);
      if (firstPaidAt && firstPaidAt >= rangeStart) {
        newCustomerCount += 1;
      } else {
        returningCustomerCount += 1;
      }
    }

    return {
      range,
      revenuePaise,
      orderCount,
      averageOrderValuePaise:
        orderCount > 0 ? Math.round(revenuePaise / orderCount) : 0,
      needsReviewCount,
      lowStockCount,
      newCustomerCount,
      returningCustomerCount,
    };
  }

  async getRevenueSeries(
    range: AnalyticsRange,
  ): Promise<AdminRevenueSeriesResponse> {
    const since = sinceForRange(range);
    const rows = await this.repository.revenueSeries(since);

    return {
      range,
      points: rows.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        revenuePaise: Number(row.revenue_paise),
        orderCount: Number(row.order_count),
      })),
    };
  }

  async getOrderStatusBreakdown(
    range: AnalyticsRange,
  ): Promise<AdminOrderStatusBreakdownResponse> {
    const since = sinceForRange(range);
    const rows = await this.repository.orderStatusBreakdown(since);
    const counts = new Map(rows.map((row) => [row.status, row._count._all]));

    const statuses = Object.values(OrderStatus);

    return {
      items: statuses.map((status) => ({
        status,
        count: counts.get(status) ?? 0,
      })),
    };
  }

  async getTopProducts(
    range: AnalyticsRange,
    limit: number,
  ): Promise<AdminTopProductsResponse> {
    const since = sinceForRange(range);
    const items = await this.repository.topProducts(since, limit);

    return { range, items };
  }
}
