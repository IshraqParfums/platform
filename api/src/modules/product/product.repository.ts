import { Injectable } from '@nestjs/common';
import type { Prisma, ProductImage, ProductVariant } from '@prisma/client';
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

export interface AdminProductFilters {
  status?: ProductStatus;
  collectionId?: string;
  search?: string;
}

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

  private adminWhere(filters?: AdminProductFilters): Prisma.ProductWhereInput {
    return {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.collectionId ? { collectionId: filters.collectionId } : {}),
      ...(filters?.search
        ? {
            name: { contains: filters.search, mode: 'insensitive' as const },
          }
        : {}),
    };
  }

  findAdminMany(options?: {
    filters?: AdminProductFilters;
    skip?: number;
    take?: number;
  }): Promise<ProductWithCatalogRelations[]> {
    return this.prisma.product.findMany({
      where: this.adminWhere(options?.filters),
      include: catalogInclude,
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  countAdmin(filters?: AdminProductFilters): Promise<number> {
    return this.prisma.product.count({ where: this.adminWhere(filters) });
  }

  findAdminById(id: string): Promise<ProductWithCatalogRelations | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: catalogInclude,
    });
  }

  create(
    data: Prisma.ProductCreateInput,
  ): Promise<ProductWithCatalogRelations> {
    return this.prisma.product.create({
      data,
      include: catalogInclude,
    });
  }

  update(
    id: string,
    data: Prisma.ProductUpdateInput,
  ): Promise<ProductWithCatalogRelations> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: catalogInclude,
    });
  }

  findVariantById(id: string): Promise<ProductVariant | null> {
    return this.prisma.productVariant.findUnique({ where: { id } });
  }

  createVariant(
    productId: string,
    data: Omit<Prisma.ProductVariantUncheckedCreateInput, 'productId'>,
  ): Promise<ProductVariant> {
    return this.prisma.productVariant.create({
      data: { ...data, productId },
    });
  }

  updateVariant(
    id: string,
    data: Prisma.ProductVariantUpdateInput,
  ): Promise<ProductVariant> {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  findImageById(id: string): Promise<ProductImage | null> {
    return this.prisma.productImage.findUnique({ where: { id } });
  }

  createImage(
    productId: string,
    data: Omit<Prisma.ProductImageUncheckedCreateInput, 'productId'>,
  ): Promise<ProductImage> {
    return this.prisma.productImage.create({
      data: { ...data, productId },
    });
  }

  updateImage(
    id: string,
    data: Prisma.ProductImageUpdateInput,
  ): Promise<ProductImage> {
    return this.prisma.productImage.update({ where: { id }, data });
  }

  deleteImage(id: string): Promise<void> {
    return this.prisma.productImage
      .delete({ where: { id } })
      .then(() => undefined);
  }
}
