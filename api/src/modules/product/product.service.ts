import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProductDetail, ProductListItem } from '@ishraqparfums/shared';
import { ProductStatus } from '@prisma/client';
import { CollectionRepository } from './collection.repository';
import type { PurchasableVariantWithProduct } from './mappers/product.mapper';
import { toProductDetail, toProductListItem } from './mappers/product.mapper';
import { ProductRepository } from './product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly collectionRepository: CollectionRepository,
  ) {}

  async list(collectionSlug?: string): Promise<ProductListItem[]> {
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

    const products = await this.productRepository.findActiveMany({
      collectionId,
    });

    return products.map(toProductListItem);
  }

  async getBySlug(slug: string): Promise<ProductDetail> {
    const product = await this.productRepository.findActiveBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return toProductDetail(product);
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

    if (variant.stockQty < 1) {
      throw new BadRequestException(
        `Variant (${variant.sizeMl}ml) is out of stock`,
      );
    }

    return variant;
  }

  assertQuantityAvailable(
    variant: Pick<PurchasableVariantWithProduct, 'stockQty' | 'sizeMl'>,
    quantity: number,
  ): void {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    if (quantity > variant.stockQty) {
      throw new BadRequestException(
        `Only ${variant.stockQty} unit(s) of ${variant.sizeMl}ml in stock`,
      );
    }
  }
}
