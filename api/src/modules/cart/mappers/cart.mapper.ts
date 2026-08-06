import type { CartItemResponse, CartResponse } from '@ishraqparfums/shared';
import { displayCompareAtPricePaise } from '../../product/mappers/product.mapper';
import type { CartItemWithRelations, CartWithItems } from '../cart.repository';

function toCartItemResponse(
  item: CartItemWithRelations,
  bespokeUnitPricePaise?: number,
): CartItemResponse {
  if (item.bespokePerfumeId && item.bespokePerfume && item.bespokeSizeMl != null) {
    const pricePaise = bespokeUnitPricePaise ?? 0;
    return {
      kind: 'bespoke',
      id: item.id,
      bespokePerfumeId: item.bespokePerfumeId,
      quantity: item.quantity,
      sizeMl: item.bespokeSizeMl,
      pricePaise,
      productName: item.bespokePerfume.name,
      productSlug: 'bespoke',
      primaryImageUrl: null,
      lineTotalPaise: pricePaise * item.quantity,
    };
  }

  const variant = item.productVariant;
  if (!variant) {
    throw new Error(`Cart item ${item.id} has neither catalog nor bespoke line`);
  }

  const product = variant.product;
  const primaryImage = product.images[0];

  return {
    kind: 'catalog',
    id: item.id,
    variantId: variant.id,
    quantity: item.quantity,
    sizeMl: variant.sizeMl,
    pricePaise: variant.pricePaise,
    compareAtPricePaise: displayCompareAtPricePaise(
      variant.pricePaise,
      variant.compareAtPricePaise,
    ),
    stockQty: Math.max(0, variant.stockQty - variant.reservedQty),
    isAvailable: variant.isAvailable,
    productName: product.name,
    productSlug: product.slug,
    collectionName: product.collection?.name ?? null,
    shortDescription: product.shortDescription?.trim() || null,
    primaryImageUrl: primaryImage?.url ?? null,
    lineTotalPaise: variant.pricePaise * item.quantity,
  };
}

export function toCartResponse(
  cart: CartWithItems,
  bespokePriceBySizeMl: (sizeMl: number) => number,
): CartResponse {
  const items = cart.items.map((item) => {
    if (item.bespokePerfumeId && item.bespokeSizeMl != null) {
      return toCartItemResponse(
        item,
        bespokePriceBySizeMl(item.bespokeSizeMl),
      );
    }
    return toCartItemResponse(item);
  });

  return {
    id: cart.id,
    items,
    subtotalPaise: items.reduce((sum, item) => sum + item.lineTotalPaise, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
