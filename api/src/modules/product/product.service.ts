import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDetail, ProductListItem } from '@ishraqparfums/shared';
import { CollectionRepository } from './collection.repository';
import {
  toProductDetail,
  toProductListItem,
} from './mappers/product.mapper';
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
}
