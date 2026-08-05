import { Injectable } from '@nestjs/common';
import type { Collection, Prisma, Product } from '@prisma/client';
import {
  CollectionStatus,
  ProductArchiveReason,
  ProductStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type CollectionWithActiveProductCount = Collection & {
  _count: { products: number };
};

@Injectable()
export class CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly activeProductCount = {
    products: {
      where: { status: ProductStatus.ACTIVE },
    },
  } satisfies Prisma.CollectionCountOutputTypeSelect;

  findAllOrdered(): Promise<CollectionWithActiveProductCount[]> {
    return this.prisma.collection.findMany({
      include: { _count: { select: this.activeProductCount } },
      orderBy: { name: 'asc' },
    });
  }

  findAllActiveOrdered(): Promise<CollectionWithActiveProductCount[]> {
    return this.prisma.collection.findMany({
      include: { _count: { select: this.activeProductCount } },
      where: { status: CollectionStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Admin-curated homepage picks. Capped at 3 with no DB uniqueness on
   * `homeRank` — a duplicate or fourth rank is a curation mistake the admin
   * can see and fix, not something worth a validation error over.
   */
  findHomeRankedOrdered(): Promise<CollectionWithActiveProductCount[]> {
    return this.prisma.collection.findMany({
      include: { _count: { select: this.activeProductCount } },
      where: { status: CollectionStatus.ACTIVE, homeRank: { not: null } },
      orderBy: { homeRank: 'asc' },
      take: 3,
    });
  }

  findBySlug(slug: string): Promise<Collection | null> {
    return this.prisma.collection.findUnique({
      where: { slug },
    });
  }

  findActiveBySlug(slug: string): Promise<Collection | null> {
    return this.prisma.collection.findFirst({
      where: { slug, status: CollectionStatus.ACTIVE },
    });
  }

  findById(id: string): Promise<Collection | null> {
    return this.prisma.collection.findUnique({
      where: { id },
    });
  }

  findByIdWithActiveProductCount(
    id: string,
  ): Promise<CollectionWithActiveProductCount | null> {
    return this.prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: this.activeProductCount } },
    });
  }

  create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return this.prisma.collection.create({ data });
  }

  update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return this.prisma.collection.update({ where: { id }, data });
  }

  /**
   * Cascades ACTIVE products in a collection to ARCHIVED + COLLECTION reason,
   * then marks the collection ARCHIVED. Runs in one transaction.
   */
  archiveWithActiveProductCascade(id: string): Promise<{
    collection: Collection;
    cascadedProductCount: number;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const cascaded = await tx.product.updateMany({
        where: {
          collectionId: id,
          status: ProductStatus.ACTIVE,
        },
        data: {
          status: ProductStatus.ARCHIVED,
          archiveReason: ProductArchiveReason.COLLECTION,
        },
      });

      const collection = await tx.collection.update({
        where: { id },
        // Clear homeRank too — otherwise an archived-but-still-ranked
        // collection could silently reappear on the homepage the moment it's
        // restored, without the admin having re-chosen it.
        data: { status: CollectionStatus.ARCHIVED, homeRank: null },
      });

      return {
        collection,
        cascadedProductCount: cascaded.count,
      };
    });
  }

  findCollectionCascadeArchivedProducts(collectionId: string): Promise<
    Array<Product & { variants: { id: string }[] }>
  > {
    return this.prisma.product.findMany({
      where: {
        collectionId,
        status: ProductStatus.ARCHIVED,
        archiveReason: ProductArchiveReason.COLLECTION,
      },
      include: {
        variants: { select: { id: true } },
      },
    });
  }

  /**
   * Restores COLLECTION-archived products (caller decides ACTIVE vs left MANUAL),
   * then marks the collection ACTIVE.
   */
  restoreCollectionAfterProductUpdates(
    id: string,
    restoreIds: string[],
    leaveManualIds: string[],
  ): Promise<Collection> {
    return this.prisma.$transaction(async (tx) => {
      if (restoreIds.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: restoreIds } },
          data: {
            status: ProductStatus.ACTIVE,
            archiveReason: null,
          },
        });
      }

      if (leaveManualIds.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: leaveManualIds } },
          data: {
            archiveReason: ProductArchiveReason.MANUAL,
          },
        });
      }

      return tx.collection.update({
        where: { id },
        data: { status: CollectionStatus.ACTIVE },
      });
    });
  }
}
