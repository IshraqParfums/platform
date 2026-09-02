import { Injectable } from '@nestjs/common';
import type { Order, OrderItem, Payment, Prisma } from '@prisma/client';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type OrderWithRelations = Order & {
  items: OrderItem[];
  payment: Payment | null;
};

export type OrderWithCustomer = OrderWithRelations & {
  customer: { id: string; phone: string };
};

export interface AdminOrderFilters {
  status?: OrderStatus;
  /** When set (and status is not), filter to any of these statuses. */
  statuses?: OrderStatus[];
  customerId?: string;
}

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  get client(): PrismaService {
    return this.prisma;
  }

  findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
  }

  findByCustomerId(
    customerId: string,
    options?: {
      skip?: number;
      take?: number;
      statuses?: OrderStatus[];
    },
  ): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: {
        customerId,
        ...(options?.statuses && options.statuses.length > 0
          ? { status: { in: options.statuses } }
          : {}),
      },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  countByCustomerId(
    customerId: string,
    statuses?: OrderStatus[],
  ): Promise<number> {
    return this.prisma.order.count({
      where: {
        customerId,
        ...(statuses && statuses.length > 0
          ? { status: { in: statuses } }
          : {}),
      },
    });
  }

  countByCustomerGroupedByStatus(customerId: string) {
    return this.prisma.order.groupBy({
      by: ['status'] as const,
      where: { customerId },
      _count: { _all: true },
    });
  }

  findPurchaserCustomerIds(
    productId: string,
    customerIds: string[],
    statuses: OrderStatus[],
  ): Promise<{ customerId: string }[]> {
    if (customerIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.order.findMany({
      where: {
        customerId: { in: customerIds },
        status: { in: statuses },
        items: {
          some: {
            productVariant: {
              productId,
            },
          },
        },
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });
  }

  async findPurchasedProductIds(
    customerId: string,
    productIds: string[],
    statuses: OrderStatus[],
  ): Promise<Set<string>> {
    if (productIds.length === 0) {
      return new Set();
    }

    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { customerId, status: { in: statuses } },
        productVariant: { productId: { in: productIds } },
      },
      select: { productVariant: { select: { productId: true } } },
      distinct: ['productVariantId'],
    });

    return new Set(
      items
        .map((item) => item.productVariant?.productId)
        .filter((id): id is string => Boolean(id)),
    );
  }

  findPendingByCustomer(
    customerId: string,
  ): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({
      where: {
        customerId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByRazorpayOrderId(
    razorpayOrderId: string,
  ): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { razorpayOrderId },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
  }

  findExpiredPending(
    now: Date,
    limit: number,
    excludeIds: string[] = [],
  ): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: { lt: now },
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }],
      take: limit,
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
  }

  async createCheckout(
    data: {
      customerId: string;
      customerName: string;
      customerEmail: string;
      shippingName: string;
      shippingPhone: string;
      shippingLine1: string;
      shippingLine2: string | null;
      shippingCity: string;
      shippingState: string;
      shippingPincode: string;
      subtotalPaise: number;
      shippingPaise: number;
      totalPaise: number;
      expiresAt: Date;
      items: Array<{
        productVariantId?: string | null;
        bespokePerfumeId?: string | null;
        productName: string;
        productSlug: string;
        sizeMl: number;
        unitPricePaise: number;
        quantity: number;
        lineTotalPaise: number;
        formulaJson?: Prisma.InputJsonValue | null;
      }>;
    },
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<OrderWithRelations> {
    return tx.order.create({
      data: {
        customerId: data.customerId,
        status: OrderStatus.PENDING_PAYMENT,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        shippingName: data.shippingName,
        shippingPhone: data.shippingPhone,
        shippingLine1: data.shippingLine1,
        shippingLine2: data.shippingLine2,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPincode: data.shippingPincode,
        subtotalPaise: data.subtotalPaise,
        shippingPaise: data.shippingPaise,
        totalPaise: data.totalPaise,
        expiresAt: data.expiresAt,
        items: {
          create: data.items.map((item) => ({
            productVariantId: item.productVariantId ?? null,
            bespokePerfumeId: item.bespokePerfumeId ?? null,
            productName: item.productName,
            productSlug: item.productSlug,
            sizeMl: item.sizeMl,
            unitPricePaise: item.unitPricePaise,
            quantity: item.quantity,
            lineTotalPaise: item.lineTotalPaise,
            formulaJson: item.formulaJson ?? undefined,
          })),
        },
      },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
  }

  async attachRazorpayOrder(
    orderId: string,
    razorpayOrderId: string,
    amountPaise: number,
  ): Promise<OrderWithRelations> {
    await this.prisma.payment.create({
      data: {
        orderId,
        razorpayOrderId,
        amountPaise,
        status: PaymentStatus.CREATED,
      },
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
  }

  /**
   * Atomically claim a pending checkout as expired. Returns false if the order
   * is no longer PENDING_PAYMENT (already abandoned, paid, or reviewed).
   */
  async tryClaimPendingAsExpired(
    orderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const result = await tx.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      data: { status: OrderStatus.EXPIRED },
    });

    if (result.count !== 1) {
      return false;
    }

    await tx.payment.updateMany({
      where: { orderId, status: PaymentStatus.CREATED },
      data: { status: PaymentStatus.FAILED },
    });

    return true;
  }

  async markExpired(
    orderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.tryClaimPendingAsExpired(orderId, tx);
  }

  async tryMarkOrderReceived(
    orderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    const result = await tx.order.updateMany({
      where: {
        id: orderId,
        status: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.EXPIRED],
        },
      },
      data: { status: OrderStatus.ORDER_RECEIVED },
    });

    return result.count === 1;
  }

  async markNeedsReview(
    orderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.NEEDS_REVIEW },
    });
  }

  async markPaymentPaid(
    orderId: string,
    razorpayPaymentId: string,
    rawPayload: Prisma.InputJsonValue,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.PAID,
        razorpayPaymentId,
        rawPayload,
      },
    });
  }

  private adminWhere(filters?: AdminOrderFilters): Prisma.OrderWhereInput {
    const statusFilter = filters?.status
      ? { status: filters.status }
      : filters?.statuses && filters.statuses.length > 0
        ? { status: { in: filters.statuses } }
        : {};

    return {
      ...statusFilter,
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
    };
  }

  findAdminMany(options?: {
    filters?: AdminOrderFilters;
    skip?: number;
    take?: number;
  }): Promise<OrderWithCustomer[]> {
    return this.prisma.order.findMany({
      where: this.adminWhere(options?.filters),
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
        customer: { select: { id: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  countAdmin(filters?: AdminOrderFilters): Promise<number> {
    return this.prisma.order.count({ where: this.adminWhere(filters) });
  }

  findAdminById(id: string): Promise<OrderWithCustomer | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
        customer: { select: { id: true, phone: true } },
      },
    });
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderWithCustomer> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
        customer: { select: { id: true, phone: true } },
      },
    });
  }
}
