export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'EXPIRED'
  | 'FAILED'
  | 'NEEDS_REVIEW'
  | 'ORDER_RECEIVED'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED';

export type PaymentStatus = 'CREATED' | 'PAID' | 'FAILED';

export interface CheckoutRequest {
  addressId: string;
  name: string;
  email: string;
}

export interface CheckoutResponse {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  razorpayKeyId: string;
  razorpayOrderId: string;
  expiresAt: string;
  shippingPaise: number;
  subtotalPaise: number;
  totalPaise: number;
}

export interface OrderItemResponse {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  sizeMl: number;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderShippingAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderPaymentSummary {
  status: PaymentStatus;
  provider: 'RAZORPAY';
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  itemCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  shippingAddress: OrderShippingAddress;
  items: OrderItemResponse[];
  payment: OrderPaymentSummary | null;
}
