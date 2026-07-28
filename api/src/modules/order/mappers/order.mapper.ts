import type {
  AdminOrderDetail,
  AdminOrderSummary,
  OrderDetail,
  OrderItemResponse,
  OrderSummary,
} from '@ishraqparfums/shared';
import type {
  OrderWithCustomer,
  OrderWithRelations,
} from '../order.repository';

function toOrderItemResponse(
  item: OrderWithRelations['items'][number],
): OrderItemResponse {
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
    ...(isBespoke && item.formulaJson != null
      ? { formulaJson: item.formulaJson }
      : {}),
  };
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

export function toOrderDetail(order: OrderWithRelations): OrderDetail {
  return {
    ...toOrderSummary(order),
    shippingAddress: {
      name: order.shippingName,
      phone: order.shippingPhone,
      line1: order.shippingLine1,
      line2: order.shippingLine2,
      city: order.shippingCity,
      state: order.shippingState,
      pincode: order.shippingPincode,
    },
    items: order.items.map(toOrderItemResponse),
    payment: order.payment
      ? {
          status: order.payment.status,
          provider: 'RAZORPAY',
          razorpayOrderId: order.payment.razorpayOrderId,
          razorpayPaymentId: order.payment.razorpayPaymentId,
          amountPaise: order.payment.amountPaise,
        }
      : null,
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
    ...toOrderDetail(order),
    customerId: order.customer.id,
    customerPhone: order.customer.phone,
  };
}
