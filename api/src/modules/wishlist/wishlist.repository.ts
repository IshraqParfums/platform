import { Injectable } from '@nestjs/common';
import type { WishlistItem } from '@prisma/client';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateWishlistId(customerId: string): Promise<string> {
    const existing = await this.prisma.wishlist.findUnique({
      where: { customerId },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.wishlist.create({
      data: { customerId },
      select: { id: true },
    });
    return created.id;
  }

  /** Bare rows — no product join. Feeds the batched catalog lookup in the service. */
  findByCustomerId(customerId: string): Promise<WishlistItem[]> {
    return this.prisma.wishlistItem.findMany({
      where: { wishlist: { customerId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** One joined query for the cheap `/wishlist/ids` endpoint — visible products only. */
  async findVisibleSlugsByCustomerId(customerId: string): Promise<string[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: {
        wishlist: { customerId },
        product: {
          status: { in: [ProductStatus.ACTIVE, ProductStatus.ARCHIVED] },
        },
      },
      select: { product: { select: { slug: true } } },
    });
    return rows.map((row) => row.product.slug);
  }

  async upsertByProductId(
    wishlistId: string,
    productId: string,
  ): Promise<void> {
    await this.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId, productId } },
      create: { wishlistId, productId },
      update: {},
    });
  }

  /**
   * One statement for many products — unlike `upsertByProductId`, a wishlist
   * insert has no per-row conditional threshold (nothing like stock to
   * check), so this can be a plain skip-duplicates batch insert rather than
   * N individual upserts. Used by guest-wishlist merge on login.
   */
  async insertManyIgnoringDuplicates(
    wishlistId: string,
    productIds: string[],
  ): Promise<void> {
    if (productIds.length === 0) return;

    await this.prisma.wishlistItem.createMany({
      data: productIds.map((productId) => ({ wishlistId, productId })),
      skipDuplicates: true,
    });
  }

  async deleteByProductId(
    customerId: string,
    productId: string,
  ): Promise<void> {
    await this.prisma.wishlistItem.deleteMany({
      where: { productId, wishlist: { customerId } },
    });
  }
}
