import type {
  CartItemResponse,
  CartResponse,
  CartUnavailableReason,
} from '@ishraqparfums/shared';
import { ProductStatus } from '@prisma/client';
import { displayCompareAtPricePaise } from '../../product/mappers/product.mapper';
import {
  availableQty,
  isVariantSellable,
} from '../../product/variant-availability';
import type { CartItemWithRelations, CartWithItems } from '../cart.repository';

function catalogUnavailableReason(
  status: ProductStatus,
  variantAvailable: boolean,
  freeStock: number,
): CartUnavailableReason | null {
  if (status === ProductStatus.DELETED) return 'DISCONTINUED';
  if (status === ProductStatus.ARCHIVED || status === ProductStatus.DRAFT) {
    return 'UNAVAILABLE';
  }
  // Shelf-off size — not the same as sold out.
  if (!variantAvailable) return 'UNAVAILABLE';
  if (freeStock <= 0) return 'OUT_OF_STOCK';
  return null;
}

function toCartItemResponse(
  item: CartItemWithRelations,
  bespokeUnitPricePaise?: number,
): CartItemResponse {
  if (item.bespokePerfumeId && item.bespokePerfume && item.bespokeSizeMl != null) {
    const pricePaise = bespokeUnitPricePaise ?? 0;
    // The brew row survives a delete so the line still has a name to show;
    // what it loses is the right to be bought.
    const deleted = item.bespokePerfume.deletedAt != null;
    return {
      kind: 'bespoke',
      id: item.id,
      bespokePerfumeId: item.bespokePerfumeId,
      quantity: item.quantity,
      sizeMl: item.bespokeSizeMl,
      pricePaise,
      isAvailable: !deleted,
      unavailableReason: deleted ? 'DISCONTINUED' : null,
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
  const freeStock = availableQty(variant);
  const sellable =
    product.status === ProductStatus.ACTIVE && isVariantSellable(variant);
  const unavailableReason = catalogUnavailableReason(
    product.status,
    variant.isAvailable,
    freeStock,
  );

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
    stockQty: freeStock,
    isAvailable: sellable,
    unavailableReason,
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

  const payable = items.filter((item) => item.isAvailable);

  return {
    id: cart.id,
    items,
    subtotalPaise: payable.reduce((sum, item) => sum + item.lineTotalPaise, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
