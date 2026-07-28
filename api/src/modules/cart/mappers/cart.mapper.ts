import type { CartItemResponse, CartResponse } from '@ishraqparfums/shared';
import { displayCompareAtPricePaise } from '../../product/mappers/product.mapper';
import type { CartItemWithVariant, CartWithItems } from '../cart.repository';

function toCartItemResponse(item: CartItemWithVariant): CartItemResponse {
  const variant = item.productVariant;
  const product = variant.product;
  const primaryImage = product.images[0];

  return {
    id: item.id,
    variantId: variant.id,
    quantity: item.quantity,
    sizeMl: variant.sizeMl,
    pricePaise: variant.pricePaise,
    compareAtPricePaise: displayCompareAtPricePaise(
      variant.pricePaise,
      variant.compareAtPricePaise,
    ),
    stockQty: variant.stockQty,
    isAvailable: variant.isAvailable,
    productName: product.name,
    productSlug: product.slug,
    primaryImageUrl: primaryImage?.url ?? null,
    lineTotalPaise: variant.pricePaise * item.quantity,
  };
}

export function toCartResponse(cart: CartWithItems): CartResponse {
  const items = cart.items.map(toCartItemResponse);

  return {
    id: cart.id,
    items,
    subtotalPaise: items.reduce((sum, item) => sum + item.lineTotalPaise, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
