import { OrderStatus } from '@prisma/client';

/** Order statuses that count as a completed purchase for Verified Buyer. */
export const VERIFIED_BUYER_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.ORDER_RECEIVED,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.READY_FOR_DISPATCH,
  OrderStatus.DISPATCHED,
  OrderStatus.DELIVERED,
];
