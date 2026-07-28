import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PaginatedResponse,
  ProductDetail,
  ProductListItem,
} from '@ishraqparfums/shared';
import type { Prisma, ProductVariant } from '@prisma/client';
import { ProductStatus } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { buildRatingSummaryMap } from '../review/rating-summary';
import { CollectionRepository } from './collection.repository';
import type {
  ProductWithCatalogRelations,
  PurchasableVariantWithProduct,
} from './mappers/product.mapper';
import { toProductDetail, toProductListItem } from './mappers/product.mapper';
import { ProductRepository } from './product.repository';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly prisma: PrismaService,
  ) {}

  availableQty(
    variant: Pick<ProductVariant, 'stockQty' | 'reservedQty'>,
  ): number {
    return Math.max(0, variant.stockQty - variant.reservedQty);
  }

  async list(
    collectionSlug?: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResponse<ProductListItem>> {
    let collectionId: string | undefined;

    if (collectionSlug !== undefined) {
      const collection =
        await this.collectionRepository.findBySlug(collectionSlug);

      if (!collection) {
        throw new NotFoundException(
          `Collection with slug "${collectionSlug}" not found`,
        );
      }

      collectionId = collection.id;
    }

    const { skip, take, page: safePage, pageSize: safePageSize } = toSkipTake(
      page,
      pageSize,
    );

    const [products, total] = await Promise.all([
      this.productRepository.findActiveMany({ collectionId, skip, take }),
      this.productRepository.countActive({ collectionId }),
    ]);

    const productIds = products.map((product) => product.id);
    const ratingRows =
      productIds.length === 0
        ? []
        : await this.prisma.review.groupBy({
            by: ['productId'],
            where: { productId: { in: productIds } },
            _avg: { rating: true },
            _count: { rating: true },
          });
    const ratings = buildRatingSummaryMap(productIds, ratingRows);

    const items = products.map((product) => {
      const summary = ratings.get(product.id);
      return toProductListItem(
        product,
        summary?.ratingAverage ?? null,
        summary?.reviewCount ?? 0,
      );
    });

    return toPaginatedResponse(items, total, safePage, safePageSize);
  }

  async getBySlug(slug: string): Promise<ProductDetail> {
    const product = await this.requireActiveBySlug(slug);
    const ratingRows = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const summary = buildRatingSummaryMap([product.id], ratingRows).get(
      product.id,
    );

    return toProductDetail(
      product,
      summary?.ratingAverage ?? null,
      summary?.reviewCount ?? 0,
    );
  }

  async requireActiveBySlug(slug: string): Promise<ProductWithCatalogRelations> {
    const product = await this.productRepository.findActiveBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findPurchasableVariant(
    variantId: string,
  ): Promise<PurchasableVariantWithProduct> {
    const variant =
      await this.productRepository.findVariantByIdWithProduct(variantId);

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    if (variant.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        `Product "${variant.product.name}" is not available for purchase`,
      );
    }

    if (!variant.isAvailable) {
      throw new BadRequestException(
        `Variant (${variant.sizeMl}ml) is currently unavailable`,
      );
    }

    if (this.availableQty(variant) < 1) {
      throw new BadRequestException(
        `Variant (${variant.sizeMl}ml) is out of stock`,
      );
    }

    return variant;
  }

  assertQuantityAvailable(
    variant: Pick<
      PurchasableVariantWithProduct,
      'stockQty' | 'reservedQty' | 'sizeMl'
    >,
    quantity: number,
  ): void {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const available = this.availableQty(variant);

    if (quantity > available) {
      throw new BadRequestException(
        `Only ${available} unit(s) of ${variant.sizeMl}ml in stock`,
      );
    }
  }

  async reserveStock(
    variantId: string,
    quantity: number,
    db: DbClient = this.prisma,
  ): Promise<void> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    const available = this.availableQty(variant);

    if (quantity > available) {
      throw new BadRequestException(
        `Only ${available} unit(s) of ${variant.sizeMl}ml in stock`,
      );
    }

    await db.productVariant.update({
      where: { id: variantId },
      data: { reservedQty: { increment: quantity } },
    });
  }

  async releaseReservation(
    variantId: string,
    quantity: number,
    db: DbClient = this.prisma,
  ): Promise<void> {
    if (quantity < 1) {
      return;
    }

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    const nextReserved = Math.max(0, variant.reservedQty - quantity);

    await db.productVariant.update({
      where: { id: variantId },
      data: { reservedQty: nextReserved },
    });
  }

  async commitReservation(
    variantId: string,
    quantity: number,
    db: DbClient = this.prisma,
  ): Promise<void> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with id "${variantId}" not found`);
    }

    if (variant.reservedQty < quantity || variant.stockQty < quantity) {
      throw new BadRequestException(
        `Cannot commit reservation for variant ${variantId}`,
      );
    }

    await db.productVariant.update({
      where: { id: variantId },
      data: {
        stockQty: { decrement: quantity },
        reservedQty: { decrement: quantity },
      },
    });
  }
}
