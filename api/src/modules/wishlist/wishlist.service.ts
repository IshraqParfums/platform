import { Injectable } from '@nestjs/common';
import type {
  WishlistMergeResponse,
  WishlistResponse,
} from '@ishraqparfums/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { buildRatingSummaryMap } from '../review/rating-summary';
import { WishlistRepository } from './wishlist.repository';
import {
  toWishlistItemResponse,
  toWishlistResponse,
} from './mappers/wishlist.mapper';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
  ) {}

  async getWishlist(customerId: string): Promise<WishlistResponse> {
    const [wishlistId, items] = await Promise.all([
      this.wishlistRepository.findOrCreateWishlistId(customerId),
      this.wishlistRepository.findByCustomerId(customerId),
    ]);

    if (items.length === 0) {
      return toWishlistResponse(wishlistId, []);
    }

    const productIds = items.map((item) => item.productId);
    const [productsById, ratingRows] = await Promise.all([
      this.productService.findManyVisibleForWishlist(productIds),
      this.prisma.review.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);
    const ratings = buildRatingSummaryMap(productIds, ratingRows);

    // A product that's gone fully invisible since being saved (reverted to
    // DRAFT) has no entry in `productsById` — silently drop that item rather
    // than fail the whole page.
    const responses = items.flatMap((item) => {
      const product = productsById.get(item.productId);
      if (!product) return [];
      return [
        toWishlistItemResponse(item, product, ratings.get(item.productId)),
      ];
    });

    return toWishlistResponse(wishlistId, responses);
  }

  async getVisibleSlugs(customerId: string): Promise<string[]> {
    return this.wishlistRepository.findVisibleSlugsByCustomerId(customerId);
  }

  async addItem(customerId: string, slug: string): Promise<WishlistResponse> {
    const product = await this.productService.requireVisibleBySlug(slug);
    const wishlistId =
      await this.wishlistRepository.findOrCreateWishlistId(customerId);
    await this.wishlistRepository.upsertByProductId(wishlistId, product.id);
    return this.getWishlist(customerId);
  }

  async removeItem(
    customerId: string,
    slug: string,
  ): Promise<WishlistResponse> {
    const product = await this.productService.requireVisibleBySlug(slug);
    await this.wishlistRepository.deleteByProductId(customerId, product.id);
    return this.getWishlist(customerId);
  }

  /**
   * Guest-merge on login. Batched, not per-slug: a slug that doesn't resolve
   * to a visible product is simply absent from `findManyVisibleIdsBySlugs`'s
   * result — skipped for free, never failing the merge — rather than a
   * per-slug try/catch around a full catalog-joined lookup.
   */
  async merge(
    customerId: string,
    slugs: string[],
  ): Promise<WishlistMergeResponse> {
    const wishlistId =
      await this.wishlistRepository.findOrCreateWishlistId(customerId);
    const idsBySlug = await this.productService.findManyVisibleIdsBySlugs([
      ...new Set(slugs),
    ]);

    await this.wishlistRepository.insertManyIgnoringDuplicates(wishlistId, [
      ...idsBySlug.values(),
    ]);

    return { wishlist: await this.getWishlist(customerId) };
  }
}
