import { BadRequestException } from '@nestjs/common';
import { ORDER_FULFILLMENT_SEQUENCE } from '@ishraqparfums/shared';
import { OrderStatus } from '@prisma/client';

/** V1 fulfillment pipeline — admin-driven, strictly forward, no cancellation (docs/01 §13). */
export const FULFILLMENT_ORDER = ORDER_FULFILLMENT_SEQUENCE as OrderStatus[];

export function assertValidOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  const fromIndex = FULFILLMENT_ORDER.indexOf(from);
  const toIndex = FULFILLMENT_ORDER.indexOf(to);

  if (toIndex === -1) {
    throw new BadRequestException(
      `"${to}" is not an admin-settable fulfillment status`,
    );
  }

  if (fromIndex === -1) {
    throw new BadRequestException(
      `Order is not yet in a fulfillment state (currently "${from}")`,
    );
  }

  if (toIndex !== fromIndex + 1) {
    const expected = FULFILLMENT_ORDER[fromIndex + 1];
    throw new BadRequestException(
      expected
        ? `Order status must advance one step at a time; expected "${expected}"`
        : 'Order has already reached the final fulfillment status',
    );
  }
}
