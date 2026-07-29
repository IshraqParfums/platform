import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminProductDetail,
  AdminProductImage,
  AdminProductListItem,
  AdminProductVariant,
  PaginatedResponse,
  ProductDetail,
  ProductListItem,
} from '@ishraqparfums/shared';
import type { ProductVariant } from '@prisma/client';
import { Prisma, ProductStatus } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildRatingSummaryMap } from '../review/rating-summary';
import { CollectionRepository } from './collection.repository';
import type { AdminListProductsQueryDto } from './dto/admin-list-products.query.dto';
import type {
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';
import type { AdjustStockDto } from './dto/adjust-stock.dto';
import type {
  CreateVariantDto,
  UpdateVariantDto,
} from './dto/admin-variant.dto';
import type { CreateImageDto, UpdateImageDto } from './dto/admin-image.dto';
import type {
  ProductWithCatalogRelations,
  PurchasableVariantWithProduct,
} from './mappers/product.mapper';
import {
  toAdminImage,
  toAdminProductDetail,
  toAdminProductListItem,
  toAdminVariant,
  toProductDetail,
  toProductListItem,
} from './mappers/product.mapper';
import { assertValidProductStatusTransition } from './product-status-transitions';
import { ProductRepository } from './product.repository';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly mediaService: MediaService,
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

    const {
      skip,
      take,
      page: safePage,
      pageSize: safePageSize,
    } = toSkipTake(page, pageSize);

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

  async requireActiveBySlug(
    slug: string,
  ): Promise<ProductWithCatalogRelations> {
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

  // --- Admin: products ---

  async listAdmin(
    query: AdminListProductsQueryDto,
  ): Promise<PaginatedResponse<AdminProductListItem>> {
    const { skip, take, page, pageSize } = toSkipTake(
      query.page,
      query.pageSize,
    );
    const filters = {
      status: query.status,
      collectionId: query.collectionId,
      search: query.search,
    };

    const [products, total] = await Promise.all([
      this.productRepository.findAdminMany({ filters, skip, take }),
      this.productRepository.countAdmin(filters),
    ]);

    return toPaginatedResponse(
      products.map(toAdminProductListItem),
      total,
      page,
      pageSize,
    );
  }

  async getAdminById(id: string): Promise<AdminProductDetail> {
    const product = await this.requireAdminById(id);
    return toAdminProductDetail(product);
  }

  async createProduct(input: CreateProductDto): Promise<AdminProductDetail> {
    const collection = await this.collectionRepository.findById(
      input.collectionId,
    );

    if (!collection) {
      throw new BadRequestException(
        `Collection with id "${input.collectionId}" not found`,
      );
    }

    if (input.status === ProductStatus.ACTIVE) {
      this.assertActivatable([]);
    }

    try {
      const product = await this.productRepository.create({
        collection: { connect: { id: input.collectionId } },
        name: input.name.trim(),
        slug: input.slug,
        shortDescription: input.shortDescription.trim(),
        detailedDescription: input.detailedDescription.trim(),
        status: input.status ?? ProductStatus.DRAFT,
      });

      return toAdminProductDetail(product);
    } catch (error) {
      throw this.mapProductSlugConflict(error, input.slug);
    }
  }

  async updateProduct(
    id: string,
    input: UpdateProductDto,
  ): Promise<AdminProductDetail> {
    const current = await this.requireAdminById(id);

    if (input.status !== undefined) {
      assertValidProductStatusTransition(current.status, input.status);

      if (
        input.status === ProductStatus.ACTIVE &&
        current.status !== ProductStatus.ACTIVE
      ) {
        this.assertActivatable(current.variants);
      }
    }

    if (input.collectionId !== undefined) {
      const collection = await this.collectionRepository.findById(
        input.collectionId,
      );

      if (!collection) {
        throw new BadRequestException(
          `Collection with id "${input.collectionId}" not found`,
        );
      }
    }

    try {
      const product = await this.productRepository.update(id, {
        ...(input.collectionId !== undefined
          ? { collection: { connect: { id: input.collectionId } } }
          : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.shortDescription !== undefined
          ? { shortDescription: input.shortDescription.trim() }
          : {}),
        ...(input.detailedDescription !== undefined
          ? { detailedDescription: input.detailedDescription.trim() }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      });

      return toAdminProductDetail(product);
    } catch (error) {
      throw this.mapProductSlugConflict(error, input.slug);
    }
  }

  private assertActivatable(variants: { length: number }): void {
    if (variants.length === 0) {
      throw new BadRequestException(
        'Add at least one variant before activating this product',
      );
    }
  }

  private async requireAdminById(
    id: string,
  ): Promise<ProductWithCatalogRelations> {
    const product = await this.productRepository.findAdminById(id);

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  private mapProductSlugConflict(
    error: unknown,
    slug: string | undefined,
  ): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      slug !== undefined
    ) {
      return new ConflictException(
        `A product with slug "${slug}" already exists`,
      );
    }

    return error;
  }

  // --- Admin: variants ---

  async createVariant(
    productId: string,
    input: CreateVariantDto,
  ): Promise<AdminProductVariant> {
    await this.requireAdminById(productId);

    try {
      const variant = await this.productRepository.createVariant(productId, {
        sizeMl: input.sizeMl,
        pricePaise: input.pricePaise,
        compareAtPricePaise: input.compareAtPricePaise ?? null,
        sku: input.sku ?? null,
        stockQty: input.stockQty ?? 0,
      });

      return toAdminVariant(variant);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A variant of ${input.sizeMl}ml already exists for this product`,
        );
      }

      throw error;
    }
  }

  async updateVariant(
    productId: string,
    variantId: string,
    input: UpdateVariantDto,
  ): Promise<AdminProductVariant> {
    await this.requireVariantOfProduct(productId, variantId);

    const variant = await this.productRepository.updateVariant(variantId, {
      ...(input.pricePaise !== undefined
        ? { pricePaise: input.pricePaise }
        : {}),
      ...(input.compareAtPricePaise !== undefined
        ? { compareAtPricePaise: input.compareAtPricePaise }
        : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.isAvailable !== undefined
        ? { isAvailable: input.isAvailable }
        : {}),
    });

    return toAdminVariant(variant);
  }

  private async requireVariantOfProduct(
    productId: string,
    variantId: string,
  ): Promise<ProductVariant> {
    const variant = await this.productRepository.findVariantById(variantId);

    if (!variant || variant.productId !== productId) {
      throw new NotFoundException(
        `Variant with id "${variantId}" not found for this product`,
      );
    }

    return variant;
  }

  // --- Admin: inventory ---

  async adjustStock(
    productId: string,
    variantId: string,
    input: AdjustStockDto,
  ): Promise<AdminProductVariant> {
    const hasAdjustment = input.adjustment !== undefined;
    const hasAbsolute = input.stockQty !== undefined;

    if (hasAdjustment === hasAbsolute) {
      throw new BadRequestException(
        'Provide exactly one of "adjustment" or "stockQty"',
      );
    }

    if (hasAdjustment && input.adjustment === 0) {
      throw new BadRequestException('adjustment must be a non-zero integer');
    }

    const variant = await this.requireVariantOfProduct(productId, variantId);
    const nextStockQty = hasAdjustment
      ? variant.stockQty + (input.adjustment as number)
      : (input.stockQty as number);

    if (nextStockQty < 0) {
      throw new BadRequestException('Stock cannot go negative');
    }

    if (nextStockQty < variant.reservedQty) {
      throw new BadRequestException(
        'Cannot reduce stock below the reserved quantity',
      );
    }

    const updated = await this.productRepository.updateVariant(variantId, {
      stockQty: nextStockQty,
    });

    return toAdminVariant(updated);
  }

  // --- Admin: images ---

  async addImage(
    productId: string,
    file: Express.Multer.File,
    input: CreateImageDto,
  ): Promise<AdminProductImage> {
    await this.requireAdminById(productId);

    const uploaded = await this.mediaService.uploadProductImage(
      productId,
      file,
    );

    try {
      const image = await this.productRepository.createImage(productId, {
        url: uploaded.url,
        storagePath: uploaded.storagePath,
        altText: input.altText ?? null,
        displayOrder: input.displayOrder ?? 0,
      });

      return toAdminImage(image);
    } catch (error) {
      await this.mediaService.remove(uploaded.storagePath);
      throw error;
    }
  }

  async updateImage(
    productId: string,
    imageId: string,
    input: UpdateImageDto,
  ): Promise<AdminProductImage> {
    await this.requireImageOfProduct(productId, imageId);

    const image = await this.productRepository.updateImage(imageId, {
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      ...(input.displayOrder !== undefined
        ? { displayOrder: input.displayOrder }
        : {}),
    });

    return toAdminImage(image);
  }

  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await this.requireImageOfProduct(productId, imageId);
    await this.mediaService.remove(image.storagePath);
    await this.productRepository.deleteImage(imageId);
  }

  private async requireImageOfProduct(productId: string, imageId: string) {
    const image = await this.productRepository.findImageById(imageId);

    if (!image || image.productId !== productId) {
      throw new NotFoundException(
        `Image with id "${imageId}" not found for this product`,
      );
    }

    return image;
  }
}
