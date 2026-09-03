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

    // Active + on-shelf sizes (sold-out included; shelf-off excluded). In-stock first.
    const ids = await this.findActiveListableIds(options, sort);
    if (ids.length === 0) return [];

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

  private async findActiveListableIds(
    options: ActiveProductListOptions | undefined,
    sort: ProductListSort,
  ): Promise<string[]> {
    const collectionId = options?.collectionId ?? null;
    const search = options?.search ?? null;
    const skip = options?.skip ?? 0;
    const take = options?.take;
    const byName = sort === 'name-asc';

    const rows =
      take === undefined
        ? byName
          ? await this.prisma.$queryRaw<{ id: string }[]>`
              SELECT p.id FROM products p
              WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
                AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
                AND (${search}::text IS NULL OR p.name ILIKE '%' || ${search} || '%')
                AND EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                )
              ORDER BY
                CASE WHEN EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                    AND v."stockQty" - v."reservedQty" > 0
                ) THEN 0 ELSE 1 END,
                p.name ASC
            `
          : await this.prisma.$queryRaw<{ id: string }[]>`
              SELECT p.id FROM products p
              WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
                AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
                AND (${search}::text IS NULL OR p.name ILIKE '%' || ${search} || '%')
                AND EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                )
              ORDER BY
                CASE WHEN EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                    AND v."stockQty" - v."reservedQty" > 0
                ) THEN 0 ELSE 1 END,
                p."createdAt" DESC
            `
        : byName
          ? await this.prisma.$queryRaw<{ id: string }[]>`
              SELECT p.id FROM products p
              WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
                AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
                AND (${search}::text IS NULL OR p.name ILIKE '%' || ${search} || '%')
                AND EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                )
              ORDER BY
                CASE WHEN EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                    AND v."stockQty" - v."reservedQty" > 0
                ) THEN 0 ELSE 1 END,
                p.name ASC
              LIMIT ${take} OFFSET ${skip}
            `
          : await this.prisma.$queryRaw<{ id: string }[]>`
              SELECT p.id FROM products p
              WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
                AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
                AND (${search}::text IS NULL OR p.name ILIKE '%' || ${search} || '%')
                AND EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                )
              ORDER BY
                CASE WHEN EXISTS (
                  SELECT 1 FROM product_variants v
                  WHERE v."productId" = p.id AND v."isAvailable" = true
                    AND v."stockQty" - v."reservedQty" > 0
                ) THEN 0 ELSE 1 END,
                p."createdAt" DESC
              LIMIT ${take} OFFSET ${skip}
            `;

    return rows.map((row) => row.id);
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

    // Price from on-shelf sizes (sold-out included). In-stock products first.
    const rows =
      take === undefined
        ? await this.prisma.$queryRaw<{ id: string }[]>`
            SELECT p.id
            FROM products p
            INNER JOIN product_variants pv
              ON pv."productId" = p.id
             AND pv."isAvailable" = true
            WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
              AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
              AND (
                ${search}::text IS NULL
                OR p.name ILIKE '%' || ${search} || '%'
              )
            GROUP BY p.id
            ORDER BY
              CASE WHEN BOOL_OR(pv."stockQty" - pv."reservedQty" > 0)
                THEN 0 ELSE 1 END,
              MIN(pv."pricePaise") ${PrismaNamespace.raw(direction)},
              p.name ASC
          `
        : await this.prisma.$queryRaw<{ id: string }[]>`
            SELECT p.id
            FROM products p
            INNER JOIN product_variants pv
              ON pv."productId" = p.id
             AND pv."isAvailable" = true
            WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
              AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
              AND (
                ${search}::text IS NULL
                OR p.name ILIKE '%' || ${search} || '%'
              )
            GROUP BY p.id
            ORDER BY
              CASE WHEN BOOL_OR(pv."stockQty" - pv."reservedQty" > 0)
                THEN 0 ELSE 1 END,
              MIN(pv."pricePaise") ${PrismaNamespace.raw(direction)},
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
    const collectionId = options?.collectionId ?? null;
    const search = options?.search ?? null;

    return this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM products p
      WHERE p.status = CAST('ACTIVE' AS "ProductStatus")
        AND (${collectionId}::text IS NULL OR p."collectionId" = ${collectionId})
        AND (
          ${search}::text IS NULL
          OR p.name ILIKE '%' || ${search} || '%'
        )
        AND EXISTS (
          SELECT 1 FROM product_variants v
          WHERE v."productId" = p.id
            AND v."isAvailable" = true
        )
    `.then((rows) => Number(rows[0]?.count ?? 0));
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

  findVisibleBySlug(slug: string): Promise<ProductWithCatalogRelations | null> {
    return this.prisma.product.findFirst({
      where: {
        slug,
        status: { in: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED] },
      },
      include: catalogInclude,
    });
  }

  /** Id-only, no `catalogInclude` — for callers that just need to resolve
   *  slugs to ids (e.g. wishlist merge), not render a catalog card. */
  findVisibleIdsBySlugs(
    slugs: string[],
  ): Promise<{ id: string; slug: string }[]> {
    if (slugs.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.product.findMany({
      where: {
        slug: { in: slugs },
        status: { in: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED] },
      },
      select: { id: true, slug: true },
    });
  }

  /** Visible (ACTIVE or ARCHIVED), not active-listable — a wishlist keeps
   *  showing an archived product the shop shelf no longer lists. */
  findManyVisibleByIds(ids: string[]): Promise<ProductWithCatalogRelations[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.product.findMany({
      where: {
        id: { in: ids },
        status: { in: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED] },
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

  findVariantsByIdsWithProduct(
    variantIds: string[],
  ): Promise<PurchasableVariantWithProduct[]> {
    if (variantIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
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

  /**
   * Available variants on live products whose free stock
   * (stock − reserved) is at or below the threshold.
   */
  async findLowStockVariants(threshold: number): Promise<
    Array<{
      id: string;
      sizeMl: number;
      stockQty: number;
      reservedQty: number;
      product: { id: string; name: string };
    }>
  > {
    const rows = await this.prisma.productVariant.findMany({
      where: {
        isAvailable: true,
        product: { status: ProductStatus.ACTIVE },
      },
      select: {
        id: true,
        sizeMl: true,
        stockQty: true,
        reservedQty: true,
        product: { select: { id: true, name: true } },
      },
      orderBy: [{ stockQty: 'asc' }, { sizeMl: 'asc' }],
    });

    return rows
      .filter((row) => Math.max(0, row.stockQty - row.reservedQty) <= threshold)
      .sort((a, b) => {
        const freeA = Math.max(0, a.stockQty - a.reservedQty);
        const freeB = Math.max(0, b.stockQty - b.reservedQty);
        if (freeA !== freeB) return freeA - freeB;
        const nameCmp = a.product.name.localeCompare(b.product.name);
        if (nameCmp !== 0) return nameCmp;
        return a.sizeMl - b.sizeMl;
      });
  }
}
