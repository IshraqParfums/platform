import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type {
  AdminOrderDetail,
  AdminOrderSummary,
  CheckoutResponse,
  CustomerOrderListResponse,
  CustomerOrderStatusGroup,
  OrderDetail,
  OrderSummary,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import {
  SHIPPING_PAISE,
  countsFromStatusRows,
  statusesForAdminOrderGroup,
  statusesForCustomerOrderGroup,
} from '@ishraqparfums/shared';
import { OrderStatus, type Prisma } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { FeatureUnavailableException } from '../../config';
import { AddressService } from '../address/address.service';
import { BespokePricingService } from '../bespoke/bespoke-pricing.service';
import { BespokeService } from '../bespoke/bespoke.service';
import { CartService } from '../cart/cart.service';
import { isCheckoutLinePurchasable } from '../cart/cart-line-purchasable';
import { CustomerService } from '../customer/customer.service';
import { PaymentService } from '../payment/payment.service';
import { ProductService } from '../product/product.service';
import type { AdminListOrdersQueryDto } from './dto/admin-list-orders.query.dto';
import {
  toAdminOrderDetail,
  toAdminOrderSummary,
  toOrderDetail,
  toOrderSummary,
} from './mappers/order.mapper';
import {
  CHECKOUT_RESERVATION_TTL_SECONDS,
  ORDER_EXPIRY_SWEEP_BATCH_SIZE,
  ORDER_EXPIRY_SWEEP_MAX_PAGES,
} from './order.constants';
import { OrderRepository, type OrderWithRelations } from './order.repository';
import { assertValidOrderStatusTransition } from './order-status-transitions';
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
    private readonly bespokeService: BespokeService,
    private readonly bespokePricing: BespokePricingService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  async listForCustomer(
    customerId: string,
    page?: number,
    pageSize?: number,
    statusGroup: CustomerOrderStatusGroup = 'all',
  ): Promise<CustomerOrderListResponse> {
    const {
      skip,
      take,
      page: safePage,
      pageSize: safePageSize,
    } = toSkipTake(page, pageSize);

    const statuses = statusesForCustomerOrderGroup(statusGroup);
    const statusList = statuses ? [...statuses] : undefined;

    const [orders, total, grouped] = await Promise.all([
      this.orderRepository.findByCustomerId(customerId, {
        skip,
        take,
        statuses: statusList,
      }),
      this.orderRepository.countByCustomerId(customerId, statusList),
      this.orderRepository.countByCustomerGroupedByStatus(customerId),
    ]);

    const counts = countsFromStatusRows(
      grouped.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    );

    return {
      ...toPaginatedResponse(
        orders.map(toOrderSummary),
        total,
        safePage,
        safePageSize,
      ),
      counts,
    };
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

  findPurchasedProductIds(
    customerId: string,
    productIds: string[],
  ): Promise<Set<string>> {
    return this.orderRepository.findPurchasedProductIds(
      customerId,
      productIds,
      VERIFIED_BUYER_ORDER_STATUSES,
    );
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

    const reservationTtlSeconds = CHECKOUT_RESERVATION_TTL_SECONDS;
    const shippingPaise = SHIPPING_PAISE;
    const address = await this.addressService.getOwnedOrThrow(
      customerId,
      input.addressId,
    );

    await this.customerService.updateProfile(customerId, { name, email });

    const cart = await this.cartService.getCart(customerId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const sellable = cart.items.filter(isCheckoutLinePurchasable);
    const skipped = cart.items.filter(
      (item) => !isCheckoutLinePurchasable(item),
    );

    if (sellable.length === 0) {
      throw new BadRequestException(
        'No available items to checkout. Remove unavailable items from your cart.',
      );
    }

    for (const item of skipped) {
      await this.cartService.removeItem(customerId, item.id, 'summary');
    }

    const lineSnapshots: Array<{
      productVariantId?: string | null;
      bespokePerfumeId?: string | null;
      productName: string;
      productSlug: string;
      sizeMl: number;
      unitPricePaise: number;
      quantity: number;
      lineTotalPaise: number;
      formulaJson?: Prisma.InputJsonValue | null;
    }> = [];

    let subtotalPaise = 0;

    const variantIds = sellable
      .filter((item) => item.kind !== 'bespoke')
      .map((item) => item.variantId);
    const bespokeIds = sellable
      .filter((item) => item.kind === 'bespoke')
      .map((item) => item.bespokePerfumeId);

    const [variantsById, perfumesById] = await Promise.all([
      this.productService.findPurchasableVariants(variantIds),
      this.bespokeService.requireManyOwned(customerId, bespokeIds),
    ]);

    for (const item of sellable) {
      if (item.kind === 'bespoke') {
        // Guaranteed present — requireManyOwned already threw otherwise.
        const perfume = perfumesById.get(item.bespokePerfumeId)!;
        this.bespokePricing.assertAllowedSize(item.sizeMl);
        const unitPricePaise = this.bespokePricing.unitPricePaise(item.sizeMl);
        const lineTotalPaise = unitPricePaise * item.quantity;
        subtotalPaise += lineTotalPaise;

        lineSnapshots.push({
          productVariantId: null,
          bespokePerfumeId: perfume.id,
          productName: perfume.name,
          productSlug: 'bespoke',
          sizeMl: item.sizeMl,
          unitPricePaise,
          quantity: item.quantity,
          lineTotalPaise,
          formulaJson: perfume.formulaJson,
        });
        continue;
      }

      // Guaranteed present — findPurchasableVariants already threw otherwise.
      const variant = variantsById.get(item.variantId)!;
      this.productService.assertQuantityAvailable(variant, item.quantity);

      const lineTotalPaise = variant.pricePaise * item.quantity;
      subtotalPaise += lineTotalPaise;

      lineSnapshots.push({
        productVariantId: variant.id,
        bespokePerfumeId: null,
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
    const totalPaise = subtotalPaise + shippingPaise;

    const order = await this.orderRepository.client.$transaction(async (tx) => {
      // Per-row atomic conditional decrement — the stock guard threshold differs
      // per variant/quantity, so this can't be safely expressed as one batched
      // UPDATE without raw multi-row SQL. Deliberately left as N statements.
      for (const line of lineSnapshots) {
        if (!line.productVariantId) {
          continue;
        }
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

      // Keep feature-misconfig / 503 distinct from upstream Razorpay API failures.
      if (error instanceof FeatureUnavailableException) {
        throw error;
      }
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE
      ) {
        throw error;
      }

      throw new BadRequestException(
        'Unable to start payment. Please try checkout again.',
      );
    }
  }

  async finalizePaidOrder(
    input: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      rawPayload: unknown;
    },
    expectedCustomerId?: string,
  ): Promise<OrderDetail> {
    const order = await this.orderRepository.findByRazorpayOrderId(
      input.razorpayOrderId,
    );

    if (!order) {
      throw new NotFoundException(
        `Order for Razorpay order "${input.razorpayOrderId}" not found`,
      );
    }

    // Only enforced for the customer-facing verify path — the webhook and
    // internal reconciliation callers finalize with no customer context and
    // must keep working unchanged. Same "not found" shape as a genuinely
    // missing order (never `Forbidden`), so this can't be used to enumerate
    // which order ids exist.
    if (
      expectedCustomerId !== undefined &&
      order.customerId !== expectedCustomerId
    ) {
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

          // Per-row atomic conditional decrement — same reasoning as the
          // reservation loop in `checkout()`; deliberately left as N statements.
          for (const item of order.items) {
            if (!item.productVariantId) {
              continue;
            }
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
    const now = new Date();
    let page: OrderWithRelations[];
    let pages = 0;

    do {
      page = await this.orderRepository.findExpiredPending(
        now,
        ORDER_EXPIRY_SWEEP_BATCH_SIZE,
      );
      pages += 1;

      for (const order of page) {
        try {
          await this.reconcilePendingCheckout(order);
        } catch (error) {
          this.logger.error(
            `Failed reconciling order ${order.id}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      if (
        page.length === ORDER_EXPIRY_SWEEP_BATCH_SIZE &&
        pages >= ORDER_EXPIRY_SWEEP_MAX_PAGES
      ) {
        this.logger.warn(
          `Order expiry backlog exceeds ${pages * ORDER_EXPIRY_SWEEP_BATCH_SIZE} orders; deferring remainder to next tick`,
        );
        break;
      }
    } while (page.length === ORDER_EXPIRY_SWEEP_BATCH_SIZE);
  }

  /**
   * Customer abandoned Razorpay (dismiss / failure) — release the hard stock
   * hold immediately when unpaid. Idempotent; safe if the TTL sweeper races.
   */
  async abandonCheckout(customerId: string, orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.customerId !== customerId) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }

    await this.reconcilePendingCheckout(order);
  }

  /**
   * Resolve a PENDING_PAYMENT checkout: finalize if Razorpay already captured,
   * otherwise release reservations and expire. Shared by abandon + TTL sweeper.
   */
  private async reconcilePendingCheckout(
    order: OrderWithRelations,
  ): Promise<void> {
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
          rawPayload: { source: 'checkout-reconcile' },
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

    await this.reconcilePendingCheckout(pending);
  }

  private async releaseAndExpire(order: OrderWithRelations): Promise<void> {
    await this.orderRepository.client.$transaction(async (tx) => {
      const claimed = await this.orderRepository.tryClaimPendingAsExpired(
        order.id,
        tx,
      );

      if (!claimed) {
        return;
      }

      for (const item of order.items) {
        if (!item.productVariantId) {
          continue;
        }
        await this.productService.releaseReservation(
          item.productVariantId,
          item.quantity,
          tx,
        );
      }
    });
  }

  // --- Admin ---

  async listAdmin(
    query: AdminListOrdersQueryDto,
  ): Promise<PaginatedResponse<AdminOrderSummary>> {
    const { skip, take, page, pageSize } = toSkipTake(
      query.page,
      query.pageSize,
    );

    const groupStatuses =
      !query.status && query.statusGroup
        ? statusesForAdminOrderGroup(query.statusGroup)
        : null;

    const filters = {
      status: query.status,
      statuses: groupStatuses
        ? ([...groupStatuses] as OrderStatus[])
        : undefined,
      customerId: query.customerId,
    };

    const [orders, total] = await Promise.all([
      this.orderRepository.findAdminMany({ filters, skip, take }),
      this.orderRepository.countAdmin(filters),
    ]);

    return toPaginatedResponse(
      orders.map(toAdminOrderSummary),
      total,
      page,
      pageSize,
    );
  }

  async getAdminById(id: string): Promise<AdminOrderDetail> {
    const order = await this.orderRepository.findAdminById(id);

    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    return toAdminOrderDetail(order);
  }

  async updateStatusAsAdmin(
    id: string,
    status: OrderStatus,
  ): Promise<AdminOrderDetail> {
    const order = await this.orderRepository.findAdminById(id);

    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    assertValidOrderStatusTransition(order.status, status);

    const updated = await this.orderRepository.updateStatus(id, status);
    return toAdminOrderDetail(updated);
  }
}
