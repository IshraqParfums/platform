import { Injectable } from '@nestjs/common';
import type {
  BespokePerfume,
  Cart,
  CartItem,
  Collection,
  Product,
  ProductImage,
  ProductVariant,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  OwnedItemDeleteRow,
  OwnedQuantityUpdateRow,
} from './cart-mutation.types';

const cartInclude = {
  items: {
    include: {
      productVariant: {
        include: {
          product: {
            include: {
              images: { orderBy: { displayOrder: 'asc' as const } },
              collection: true,
            },
          },
        },
      },
      bespokePerfume: true,
    },
    orderBy: { position: 'asc' as const },
  },
};

export type CartItemWithRelations = CartItem & {
  productVariant:
    | (ProductVariant & {
        product: Product & {
          images: ProductImage[];
          collection: Collection;
        };
      })
    | null;
  bespokePerfume: BespokePerfume | null;
};

export type CartWithItems = Cart & {
  items: CartItemWithRelations[];
};

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCustomerId(customerId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { customerId },
      include: cartInclude,
    });
  }

  /** Cart id only — mutations that do not need the line graph. */
  async findOrCreateCartId(customerId: string): Promise<string> {
    const existing = await this.prisma.cart.findUnique({
      where: { customerId },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.cart.create({
      data: { customerId },
      select: { id: true },
    });
    return created.id;
  }

  async findOrCreateByCustomerId(customerId: string): Promise<CartWithItems> {
    const existing = await this.findByCustomerId(customerId);

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { customerId },
      include: cartInclude,
    });
  }

  findItemById(itemId: string): Promise<CartItem | null> {
    return this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
  }

  /** Ownership check without loading the full cart graph. */
  findOwnedItem(
    customerId: string,
    itemId: string,
  ): Promise<{
    id: string;
    cartId: string;
    productVariantId: string | null;
    bespokePerfumeId: string | null;
    bespokeSizeMl: number | null;
  } | null> {
    return this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { customerId } },
      select: {
        id: true,
        cartId: true,
        productVariantId: true,
        bespokePerfumeId: true,
        bespokeSizeMl: true,
      },
    });
  }

  findItemByCartAndVariant(
    cartId: string,
    productVariantId: string,
  ): Promise<CartItem | null> {
    return this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId,
          productVariantId,
        },
      },
    });
  }

  findItemByCartBespokeSize(
    cartId: string,
    bespokePerfumeId: string,
    bespokeSizeMl: number,
  ): Promise<CartItem | null> {
    return this.prisma.cartItem.findUnique({
      where: {
        cartId_bespokePerfumeId_bespokeSizeMl: {
          cartId,
          bespokePerfumeId,
          bespokeSizeMl,
        },
      },
    });
  }

  async nextPosition(cartId: string): Promise<number> {
    const aggregate = await this.prisma.cartItem.aggregate({
      where: { cartId },
      _max: { position: true },
    });
    return (aggregate._max.position ?? -1) + 1;
  }

  async upsertItem(
    cartId: string,
    productVariantId: string,
    quantity: number,
    position?: number,
  ): Promise<CartItem> {
    const existing = await this.findItemByCartAndVariant(
      cartId,
      productVariantId,
    );
    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productVariantId,
        quantity,
        position: position ?? (await this.nextPosition(cartId)),
      },
    });
  }

  async upsertBespokeItem(
    cartId: string,
    bespokePerfumeId: string,
    bespokeSizeMl: number,
    quantity: number,
    position?: number,
  ): Promise<CartItem> {
    const existing = await this.findItemByCartBespokeSize(
      cartId,
      bespokePerfumeId,
      bespokeSizeMl,
    );
    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        bespokePerfumeId,
        bespokeSizeMl,
        quantity,
        position: position ?? (await this.nextPosition(cartId)),
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  findByIdWithItems(cartId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: cartInclude,
    });
  }

  async clearItems(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async sumItemQuantities(cartId: string): Promise<number> {
    const aggregate = await this.prisma.cartItem.aggregate({
      where: { cartId },
      _sum: { quantity: true },
    });
    return aggregate._sum.quantity ?? 0;
  }

  /**
   * Ownership + stock gate + quantity write + itemCount in one round trip.
   * Returns null when no row matched (not owned, missing, or stock/status fail).
   *
   * Postgres forbids referencing the UPDATE target (`ci`) in FROM-join ON
   * clauses — stock is gated with EXISTS; variant fields join after RETURNING.
   *
   * Id columns are Prisma `String` → Postgres `text`. Do not cast params to
   * `uuid` or comparisons become `text = uuid` (42883).
   */
  async updateOwnedItemQuantity(
    customerId: string,
    itemId: string,
    quantity: number,
  ): Promise<OwnedQuantityUpdateRow | null> {
    const rows = await this.prisma.$queryRaw<OwnedQuantityUpdateRow[]>`
      WITH updated AS (
        UPDATE cart_items AS ci
        SET
          quantity = ${quantity},
          "updatedAt" = NOW()
        FROM carts AS c
        WHERE ci.id = ${itemId}
          AND c.id = ci."cartId"
          AND c."customerId" = ${customerId}
          AND (
            ci."bespokePerfumeId" IS NOT NULL
            OR EXISTS (
              SELECT 1
              FROM product_variants AS v
              INNER JOIN products AS p ON p.id = v."productId"
              WHERE v.id = ci."productVariantId"
                AND v."isAvailable" = true
                AND p.status = CAST('ACTIVE' AS "ProductStatus")
                AND (v."stockQty" - v."reservedQty") >= ${quantity}
            )
          )
        RETURNING
          ci.id,
          ci."cartId",
          ci.quantity,
          ci."productVariantId",
          ci."bespokePerfumeId",
          ci."bespokeSizeMl"
      )
      SELECT
        u.id,
        u."cartId",
        u.quantity,
        u."productVariantId",
        u."bespokePerfumeId",
        u."bespokeSizeMl",
        v."pricePaise" AS "pricePaise",
        CASE
          WHEN v.id IS NULL THEN NULL
          ELSE GREATEST(0, v."stockQty" - v."reservedQty")
        END AS "availableStock",
        (
          SELECT COALESCE(SUM(i.quantity), 0)::int
          FROM cart_items i
          WHERE i."cartId" = u."cartId"
        ) AS "itemCount"
      FROM updated u
      LEFT JOIN product_variants AS v ON v.id = u."productVariantId"
    `;

    return rows[0] ?? null;
  }

  /**
   * Ownership-scoped delete + remaining itemCount in one round trip.
   * Returns null when the line is missing or not owned.
   */
  async deleteOwnedItem(
    customerId: string,
    itemId: string,
  ): Promise<OwnedItemDeleteRow | null> {
    const rows = await this.prisma.$queryRaw<OwnedItemDeleteRow[]>`
      WITH deleted AS (
        DELETE FROM cart_items AS ci
        USING carts AS c
        WHERE ci.id = ${itemId}
          AND c.id = ci."cartId"
          AND c."customerId" = ${customerId}
        RETURNING ci.id, ci."cartId"
      )
      SELECT
        d.id,
        d."cartId",
        (
          SELECT COALESCE(SUM(i.quantity), 0)::int
          FROM cart_items i
          WHERE i."cartId" = d."cartId"
        ) AS "itemCount"
      FROM deleted d
    `;

    return rows[0] ?? null;
  }
}
