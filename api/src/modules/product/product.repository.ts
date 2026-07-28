import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ProductWithCatalogRelations } from './mappers/product.mapper';

const catalogInclude = {
  collection: true,
  variants: { orderBy: { sizeMl: 'asc' as const } },
  images: { orderBy: { displayOrder: 'asc' as const } },
};

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveMany(options?: {
    collectionId?: string;
  }): Promise<ProductWithCatalogRelations[]> {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        ...(options?.collectionId
          ? { collectionId: options.collectionId }
          : {}),
      },
      include: catalogInclude,
      orderBy: { name: 'asc' },
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
}
