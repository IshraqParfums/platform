import type {
  OrderDetail,
  OrderItemResponse,
  OrderSummary,
} from '@ishraqparfums/shared';
import type { OrderWithRelations } from '../order.repository';

function toOrderItemResponse(
  item: OrderWithRelations['items'][number],
): OrderItemResponse {
  return {
    id: item.id,
    variantId: item.productVariantId,
    productName: item.productName,
    productSlug: item.productSlug,
    sizeMl: item.sizeMl,
    unitPricePaise: item.unitPricePaise,
    quantity: item.quantity,
    lineTotalPaise: item.lineTotalPaise,
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
