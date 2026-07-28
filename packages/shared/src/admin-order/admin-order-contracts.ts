import type { OrderDetail, OrderStatus, OrderSummary } from "../order/order-contracts.js";

export interface AdminOrderSummary extends OrderSummary {
  customerId: string;
  customerPhone: string;
}

export interface AdminOrderDetail extends OrderDetail {
  customerId: string;
  customerPhone: string;
}

export interface UpdateOrderStatusBody {
  status: OrderStatus;
}
