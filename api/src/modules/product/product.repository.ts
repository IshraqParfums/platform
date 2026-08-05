import { Injectable } from '@nestjs/common';
import type { ProductListSort } from '@ishraqparfums/shared';
import type { Prisma, ProductImage, ProductVariant } from '@prisma/client';
import { ProductStatus, Prisma as PrismaNamespace } from '@prisma/client';
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

export interface ActiveProductListOptions {
  collectionId?: string;
  search?: string;
  sort?: ProductListSort;
  skip?: number;
  take?: number;
}

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private activeWhere(options?: {
    collectionId?: string;
    search?: string;
  }): Prisma.ProductWhereInput {
    return {
      status: ProductStatus.ACTIVE,
      ...(options?.collectionId ? { collectionId: options.collectionId } : {}),
      ...(options?.search
        ? {
            name: { contains: options.search, mode: 'insensitive' as const },
          }
        : {}),
    };
  }

  private prismaOrderBy(
    sort: ProductListSort | undefined,
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'name-asc':
        return { name: 'asc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private isPriceSort(
    sort: ProductListSort | undefined,
  ): sort is 'price-asc' | 'price-desc' {
    return sort === 'price-asc' || sort === 'price-desc';
  }

  async findActiveMany(
    options?: ActiveProductListOptions,
  ): Promise<ProductWithCatalogRelations[]> {
    const sort = options?.sort ?? 'newest';

    if (this.isPriceSort(sort)) {
      return this.findActiveManyByPrice(options, sort);
    }

    return this.prisma.product.findMany({
      where: this.activeWhere(options),
      include: catalogInclude,
      orderBy: this.prismaOrderBy(sort),
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  private async findActiveManyByPrice(
    options: ActiveProductListOptions | undefined,
    sort: 'price-asc' | 'price-desc',
  ): Promise<ProductWithCatalogRelations[]> {
    const direction = sort === 'price-asc' ? 'ASC' : 'DESC';
    const collectionId = options?.collectionId ?? null;
    const search = options?.search ?? null;
    const skip = options?.skip ?? 0;
    const take = options?.take;

    // Price lives on variants — paginate by MIN(price) then hydrate.
    const rows =
      take === undefined
        ? await this.prisma.$queryRaw<{ id: string }[]>`
            SELECT p.id
            FROM products p
            LEFT JOIN product_variants pv ON pv."productId" = p.id
            WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
              AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
              AND (
                ${search}::text IS NULL
                OR p.name ILIKE '%' || ${search} || '%'
              )
            GROUP BY p.id
            ORDER BY MIN(pv."pricePaise") ${PrismaNamespace.raw(direction)} NULLS LAST,
              p.name ASC
          `
        : await this.prisma.$queryRaw<{ id: string }[]>`
            SELECT p.id
            FROM products p
            LEFT JOIN product_variants pv ON pv."productId" = p.id
            WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
              AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
              AND (
                ${search}::text IS NULL
                OR p.name ILIKE '%' || ${search} || '%'
              )
            GROUP BY p.id
            ORDER BY MIN(pv."pricePaise") ${PrismaNamespace.raw(direction)} NULLS LAST,
              p.name ASC
            LIMIT ${take} OFFSET ${skip}
          `;

    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: catalogInclude,
    });

    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is ProductWithCatalogRelations =>
        Boolean(product),
      );
  }

  countActive(options?: {
    collectionId?: string;
    search?: string;
  }): Promise<number> {
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
