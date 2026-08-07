import { Injectable } from '@nestjs/common';
import { ORDER_FULFILLMENT_SEQUENCE } from '@ishraqparfums/shared';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Orders only reach these statuses after a successful payment (see order-status-transitions.ts). */
export const PAID_ORDER_STATUSES = ORDER_FULFILLMENT_SEQUENCE as OrderStatus[];

export interface RevenueRow {
  day: Date;
  revenue_paise: bigint | number | string;
  order_count: bigint | number | string;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async revenueAndOrderCount(
    since: Date | null,
  ): Promise<{ revenuePaise: number; orderCount: number }> {
    const result = await this.prisma.order.aggregate({
      where: {
        status: { in: PAID_ORDER_STATUSES },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      _sum: { totalPaise: true },
      _count: { _all: true },
    });

    return {
      revenuePaise: result._sum.totalPaise ?? 0,
      orderCount: result._count._all,
    };
  }

  countNeedsReview(): Promise<number> {
    return this.prisma.order.count({
      where: { status: OrderStatus.NEEDS_REVIEW },
    });
  }

  countLowStockVariants(threshold: number): Promise<number> {
    return this.prisma.productVariant.count({
      where: { isAvailable: true, stockQty: { lte: threshold } },
    });
  }

  /** All-time first paid-order date per customer, keyed by customerId. */
  async firstPaidOrderDates(): Promise<Map<string, Date>> {
    const rows = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { status: { in: PAID_ORDER_STATUSES } },
      _min: { createdAt: true },
    });

    return new Map(
      rows
        .filter((row) => row._min.createdAt)
        .map((row) => [row.customerId, row._min.createdAt as Date]),
    );
  }

  async customerIdsWithPaidOrderSince(since: Date | null): Promise<string[]> {
    const rows = await this.prisma.order.findMany({
      where: {
        status: { in: PAID_ORDER_STATUSES },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });

    return rows.map((row) => row.customerId);
  }

  async revenueSeries(since: Date | null): Promise<RevenueRow[]> {
    const statuses = Prisma.join(
      PAID_ORDER_STATUSES.map((status) => Prisma.sql`${status}`),
    );

    return this.prisma.$queryRaw<RevenueRow[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COALESCE(SUM("totalPaise"), 0)::bigint AS revenue_paise,
             COUNT(*)::bigint AS order_count
      FROM orders
      WHERE status = ANY(ARRAY[${statuses}]::"OrderStatus"[])
        AND (${since}::timestamptz IS NULL OR "createdAt" >= ${since}::timestamptz)
      GROUP BY 1
      ORDER BY 1
    `;
  }

  orderStatusBreakdown(since: Date | null) {
    return this.prisma.order.groupBy({
      by: ['status'],
      where: since ? { createdAt: { gte: since } } : undefined,
      _count: { _all: true },
    });
  }

  async topProducts(since: Date | null, limit: number) {
    const rows = await this.prisma.orderItem.groupBy({
      by: [
        'productVariantId',
        'bespokePerfumeId',
        'productSlug',
        'productName',
        'sizeMl',
      ],
      where: {
        order: {
          status: { in: PAID_ORDER_STATUSES },
          ...(since ? { createdAt: { gte: since } } : {}),
        },
      },
      _sum: { lineTotalPaise: true, quantity: true },
      orderBy: { _sum: { lineTotalPaise: 'desc' } },
      take: limit,
    });

    const variantIds = rows
      .map((row) => row.productVariantId)
      .filter((id): id is string => Boolean(id));

    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
              product: { select: { id: true, name: true, slug: true } },
            },
          })
        : [];
    const variantById = new Map(variants.map((v) => [v.id, v]));

    return rows.map((row) => {
      const variant = row.productVariantId
        ? variantById.get(row.productVariantId)
        : undefined;

      return {
        productId:
          variant?.product.id ??
          row.bespokePerfumeId ??
          row.productSlug,
        productName: variant?.product.name ?? row.productName,
        productSlug: variant?.product.slug ?? row.productSlug,
        variantId: row.productVariantId,
        sizeMl: variant?.sizeMl ?? row.sizeMl,
        quantitySold: row._sum.quantity ?? 0,
        revenuePaise: row._sum.lineTotalPaise ?? 0,
      };
    });
  }
}
