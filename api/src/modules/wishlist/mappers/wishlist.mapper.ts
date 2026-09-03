import type { WishlistItem } from '@prisma/client';
import type {
  WishlistItemResponse,
  WishlistResponse,
} from '@ishraqparfums/shared';
import {
  toProductListItem,
  type ProductWithCatalogRelations,
} from '../../product/mappers/product.mapper';
import type { ProductRatingSummary } from '../../review/rating-summary';

export function toWishlistItemResponse(
  item: WishlistItem,
  product: ProductWithCatalogRelations,
  rating: ProductRatingSummary | undefined,
): WishlistItemResponse {
  return {
    ...toProductListItem(
      product,
      rating?.ratingAverage ?? null,
      rating?.reviewCount ?? 0,
    ),
    id: item.id,
    addedAt: item.createdAt.toISOString(),
  };
}

export function toWishlistResponse(
  wishlistId: string,
  items: WishlistItemResponse[],
): WishlistResponse {
  return {
    id: wishlistId,
    items,
    itemCount: items.length,
  };
}
