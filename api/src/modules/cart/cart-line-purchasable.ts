import type { CartItemResponse } from '@ishraqparfums/shared';

/** Same rule the shop cart uses for payable lines. */
export function isCheckoutLinePurchasable(item: CartItemResponse): boolean {
  return item.isAvailable && item.quantity > 0;
}
