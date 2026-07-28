import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ProductWithCatalogRelations,
  PurchasableVariantWithProduct,
} from './mappers/product.mapper';

const catalogInclude = {
  collection: true,
  variants: { orderBy: { sizeMl: 'asc' as const } },
  images: { orderBy: { displayOrder: 'asc' as const } },
};

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private activeWhere(options?: { collectionId?: string }) {
    return {
      status: ProductStatus.ACTIVE,
      ...(options?.collectionId ? { collectionId: options.collectionId } : {}),
    };
  }

  findActiveMany(options?: {
    collectionId?: string;
    skip?: number;
    take?: number;
  }): Promise<ProductWithCatalogRelations[]> {
    return this.prisma.product.findMany({
      where: this.activeWhere(options),
      include: catalogInclude,
      orderBy: { name: 'asc' },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  countActive(options?: { collectionId?: string }): Promise<number> {
    return this.prisma.product.count({
      where: this.activeWhere(options),
    });
  }

  findActiveBySlug(slug: string): Promise<ProductWithCatalogRelations | null> {
    return this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.ACTIVE,
      },
      include: catalogInclude,
    });
  }

  findVariantByIdWithProduct(
    variantId: string,
  ): Promise<PurchasableVariantWithProduct | null> {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: {
            images: { orderBy: { displayOrder: 'asc' } },
          },
        },
      },
    });
  }
}
