import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CheckoutResponse,
  OrderDetail,
  OrderSummary,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { OrderStatus, type Prisma } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { AddressService } from '../address/address.service';
import { CartService } from '../cart/cart.service';
import { CustomerService } from '../customer/customer.service';
import { PaymentService } from '../payment/payment.service';
import { ProductService } from '../product/product.service';
import { toOrderDetail, toOrderSummary } from './mappers/order.mapper';
import { OrderRepository, type OrderWithRelations } from './order.repository';
import { VERIFIED_BUYER_ORDER_STATUSES } from './verified-buyer-statuses';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly addressService: AddressService,
    private readonly cartService: CartService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  async listForCustomer(
    customerId: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResponse<OrderSummary>> {
    const { skip, take, page: safePage, pageSize: safePageSize } = toSkipTake(
      page,
      pageSize,
    );

    const [orders, total] = await Promise.all([
      this.orderRepository.findByCustomerId(customerId, { skip, take }),
      this.orderRepository.countByCustomerId(customerId),
    ]);

    return toPaginatedResponse(
      orders.map(toOrderSummary),
      total,
      safePage,
      safePageSize,
    );
  }

  async findPurchasersOfProduct(
    productId: string,
    customerIds: string[],
  ): Promise<Set<string>> {
    const rows = await this.orderRepository.findPurchaserCustomerIds(
      productId,
      customerIds,
      VERIFIED_BUYER_ORDER_STATUSES,
    );

    return new Set(rows.map((row) => row.customerId));
  }

  async getForCustomer(
    customerId: string,
    orderId: string,
  ): Promise<OrderDetail> {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.customerId !== customerId) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    return toOrderDetail(order);
  }

  async checkout(
    customerId: string,
    input: { addressId: string; name: string; email: string },
  ): Promise<CheckoutResponse> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const razorpayWindowSeconds = this.readPositiveInt(
      'CHECKOUT_RAZORPAY_WINDOW_SECONDS',
      600,
    );
    const reservationTtlSeconds = this.readPositiveInt(
      'CHECKOUT_RESERVATION_TTL_SECONDS',
      660,
    );

    if (reservationTtlSeconds < razorpayWindowSeconds) {
      throw new BadRequestException(
        'CHECKOUT_RESERVATION_TTL_SECONDS must be >= CHECKOUT_RAZORPAY_WINDOW_SECONDS',
      );
    }

    const shippingPaise = this.readPositiveInt('SHIPPING_PAISE', 5000);
    const address = await this.addressService.getOwnedOrThrow(
      customerId,
      input.addressId,
    );

    await this.customerService.updateProfile(customerId, { name, email });

    const cart = await this.cartService.getCart(customerId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const lineSnapshots: Array<{
      productVariantId: string;
      productName: string;
      productSlug: string;
      sizeMl: number;
      unitPricePaise: number;
      quantity: number;
      lineTotalPaise: number;
    }> = [];

    let subtotalPaise = 0;

    for (const item of cart.items) {
      const variant = await this.productService.findPurchasableVariant(
        item.variantId,
      );
      this.productService.assertQuantityAvailable(variant, item.quantity);

      const lineTotalPaise = variant.pricePaise * item.quantity;
      subtotalPaise += lineTotalPaise;

      lineSnapshots.push({
        productVariantId: variant.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        sizeMl: variant.sizeMl,
        unitPricePaise: variant.pricePaise,
        quantity: item.quantity,
        lineTotalPaise,
      });
    }

    await this.cancelPendingCheckout(customerId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + reservationTtlSeconds * 1000);
    const expireByUnix =
      Math.floor(now.getTime() / 1000) + razorpayWindowSeconds;
    const totalPaise = subtotalPaise + shippingPaise;

    const order = await this.orderRepository.client.$transaction(async (tx) => {
      for (const line of lineSnapshots) {
        await this.productService.reserveStock(
          line.productVariantId,
          line.quantity,
          tx,
        );
      }

      return this.orderRepository.createCheckout(
        {
          customerId,
          customerName: name,
          customerEmail: email,
          shippingName: address.name,
          shippingPhone: address.phone,
          shippingLine1: address.line1,
          shippingLine2: address.line2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPincode: address.pincode,
          subtotalPaise,
          shippingPaise,
          totalPaise,
          expiresAt,
          items: lineSnapshots,
        },
        tx,
      );
    });

    try {
      const razorpayOrder = await this.paymentService.createRazorpayOrder({
        amountPaise: totalPaise,
        receipt: order.id.slice(0, 40),
        expireByUnix,
        notes: {
          orderId: order.id,
          customerEmail: email,
        },
      });

      const withPayment = await this.orderRepository.attachRazorpayOrder(
        order.id,
        razorpayOrder.id,
        totalPaise,
      );

      return {
        orderId: withPayment.id,
        amountPaise: totalPaise,
        currency: 'INR',
        razorpayKeyId: this.paymentService.keyId,
        razorpayOrderId: razorpayOrder.id,
        expiresAt: expiresAt.toISOString(),
        shippingPaise,
        subtotalPaise,
        totalPaise,
      };
    } catch (error) {
      this.logger.error(
        `Razorpay order creation failed for ${order.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.releaseAndExpire(order);
      throw new BadRequestException(
        'Unable to start payment. Please try checkout again.',
      );
    }
  }

  async finalizePaidOrder(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    rawPayload: unknown;
  }): Promise<OrderDetail> {
    const order = await this.orderRepository.findByRazorpayOrderId(
      input.razorpayOrderId,
    );

    if (!order) {
      throw new NotFoundException(
        `Order for Razorpay order "${input.razorpayOrderId}" not found`,
      );
    }

    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.EXPIRED &&
      order.status !== OrderStatus.NEEDS_REVIEW
    ) {
      return toOrderDetail(order);
    }

    if (order.payment?.razorpayPaymentId === input.razorpayPaymentId) {
      const refreshed = await this.orderRepository.findById(order.id);
      return toOrderDetail(refreshed ?? order);
    }

    if (order.payment && order.payment.amountPaise !== order.totalPaise) {
      throw new BadRequestException('Payment amount mismatch');
    }

    try {
      const finalized = await this.orderRepository.client.$transaction(
        async (tx) => {
          const claimed = await this.orderRepository.tryMarkOrderReceived(
            order.id,
            tx,
          );

          if (!claimed) {
            return null;
          }

          for (const item of order.items) {
            await this.productService.commitReservation(
              item.productVariantId,
              item.quantity,
              tx,
            );
          }

          await this.orderRepository.markPaymentPaid(
            order.id,
            input.razorpayPaymentId,
            input.rawPayload as Prisma.InputJsonValue,
            tx,
          );

          return true;
        },
      );

      if (!finalized) {
        const current = await this.orderRepository.findById(order.id);
        return toOrderDetail(current ?? order);
      }

      await this.cartService.clearCart(order.customerId);
      const refreshed = await this.orderRepository.findById(order.id);

      if (!refreshed) {
        throw new NotFoundException('Order not found after finalize');
      }

      return toOrderDetail(refreshed);
    } catch (error) {
      this.logger.error(
        `Failed to finalize order ${order.id}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (order.status === OrderStatus.EXPIRED) {
        await this.orderRepository.markNeedsReview(order.id);
        const reviewed = await this.orderRepository.findById(order.id);
        return toOrderDetail(reviewed ?? order);
      }

      throw error;
    }
  }

  async reconcileExpiredPendingOrders(): Promise<void> {
    const expired = await this.orderRepository.findExpiredPending(new Date());

    for (const order of expired) {
      try {
        await this.reconcileOneExpired(order);
      } catch (error) {
        this.logger.error(
          `Failed reconciling order ${order.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private async reconcileOneExpired(order: OrderWithRelations): Promise<void> {
    if (!order.razorpayOrderId) {
      await this.releaseAndExpire(order);
      return;
    }

    const paymentId = await this.paymentService.findCapturedPaymentId(
      order.razorpayOrderId,
    );

    if (paymentId) {
      try {
        await this.finalizePaidOrder({
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: paymentId,
          rawPayload: { source: 'expiry-sweeper' },
        });
        return;
      } catch {
        await this.orderRepository.markNeedsReview(order.id);
        return;
      }
    }

    const paid = await this.paymentService.isOrderPaidOnRazorpay(
      order.razorpayOrderId,
    );

    if (paid) {
      await this.orderRepository.markNeedsReview(order.id);
      return;
    }

    await this.releaseAndExpire(order);
  }

  private async cancelPendingCheckout(customerId: string): Promise<void> {
    const pending =
      await this.orderRepository.findPendingByCustomer(customerId);

    if (!pending) {
      return;
    }

    await this.releaseAndExpire(pending);
  }

  private async releaseAndExpire(order: OrderWithRelations): Promise<void> {
    await this.orderRepository.client.$transaction(async (tx) => {
      for (const item of order.items) {
        await this.productService.releaseReservation(
          item.productVariantId,
          item.quantity,
          tx,
        );
      }

      await this.orderRepository.markExpired(order.id, tx);
    });
  }

  private readPositiveInt(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    const value = raw === undefined ? fallback : Number.parseInt(raw, 10);

    if (!Number.isFinite(value) || value < 0) {
      return fallback;
    }

    return value;
  }
}
