import type {
  AdminOrderDetail,
  AdminOrderItemResponse,
  AdminOrderSummary,
  OrderDetail,
  OrderItemResponse,
  OrderSummary,
} from '@ishraqparfums/shared';
import type {
  OrderWithCustomer,
  OrderWithRelations,
} from '../order.repository';

type OrderItemRow = OrderWithRelations['items'][number];

function toOrderItemBase(item: OrderItemRow): OrderItemResponse {
  const isBespoke =
    item.bespokePerfumeId != null || item.productVariantId == null;

  return {
    id: item.id,
    kind: isBespoke ? 'bespoke' : 'catalog',
    variantId: item.productVariantId,
    bespokePerfumeId: item.bespokePerfumeId,
    productName: item.productName,
    productSlug: item.productSlug,
    sizeMl: item.sizeMl,
    unitPricePaise: item.unitPricePaise,
    quantity: item.quantity,
    lineTotalPaise: item.lineTotalPaise,
  };
}

/** Customer-facing — never includes formula IP. */
export function toOrderItemResponse(item: OrderItemRow): OrderItemResponse {
  return toOrderItemBase(item);
}

/** Admin-facing — includes formula snapshot for bespoke lines. */
export function toAdminOrderItemResponse(
  item: OrderItemRow,
): AdminOrderItemResponse {
  const base = toOrderItemBase(item);
  if (base.kind === 'bespoke' && item.formulaJson != null) {
    return { ...base, formulaJson: item.formulaJson };
  }
  return base;
}

export function toOrderSummary(order: OrderWithRelations): OrderSummary {
  return {
    id: order.id,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    subtotalPaise: order.subtotalPaise,
    shippingPaise: order.shippingPaise,
    totalPaise: order.totalPaise,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    expiresAt: order.expiresAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
  };
}

function toShippingAndPayment(order: OrderWithRelations) {
  return {
    shippingAddress: {
      name: order.shippingName,
      phone: order.shippingPhone,
      line1: order.shippingLine1,
      line2: order.shippingLine2,
      city: order.shippingCity,
      state: order.shippingState,
      pincode: order.shippingPincode,
    },
    payment: order.payment
      ? {
          status: order.payment.status,
          provider: 'RAZORPAY' as const,
          razorpayOrderId: order.payment.razorpayOrderId,
          razorpayPaymentId: order.payment.razorpayPaymentId,
          amountPaise: order.payment.amountPaise,
        }
      : null,
  };
}

export function toOrderDetail(order: OrderWithRelations): OrderDetail {
  return {
    ...toOrderSummary(order),
    ...toShippingAndPayment(order),
    items: order.items.map(toOrderItemResponse),
  };
}

export function toAdminOrderSummary(
  order: OrderWithCustomer,
): AdminOrderSummary {
  return {
    ...toOrderSummary(order),
    customerId: order.customer.id,
    customerPhone: order.customer.phone,
  };
}

export function toAdminOrderDetail(order: OrderWithCustomer): AdminOrderDetail {
  return {
    ...toOrderSummary(order),
    ...toShippingAndPayment(order),
    items: order.items.map(toAdminOrderItemResponse),
    customerId: order.customer.id,
    customerPhone: order.customer.phone,
  };
}
