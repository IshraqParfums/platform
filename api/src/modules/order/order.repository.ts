import { Injectable } from '@nestjs/common';
import type { Order, OrderItem, Payment, Prisma } from '@prisma/client';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type OrderWithRelations = Order & {
  items: OrderItem[];
  payment: Payment | null;
};

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
    options?: { skip?: number; take?: number },
  ): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  countByCustomerId(customerId: string): Promise<number> {
    return this.prisma.order.count({
      where: { customerId },
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

  findExpiredPending(now: Date): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: { lt: now },
      },
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
        productVariantId: string;
        productName: string;
        productSlug: string;
        sizeMl: number;
        unitPricePaise: number;
        quantity: number;
        lineTotalPaise: number;
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
          create: data.items,
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

  async markExpired(
    orderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.EXPIRED },
    });

    await tx.payment.updateMany({
      where: { orderId, status: PaymentStatus.CREATED },
      data: { status: PaymentStatus.FAILED },
    });
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
}
