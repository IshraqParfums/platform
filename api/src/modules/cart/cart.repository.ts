import { Injectable } from '@nestjs/common';
import type {
  BespokePerfume,
  Cart,
  CartItem,
  Product,
  ProductImage,
  ProductVariant,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const cartInclude = {
  items: {
    include: {
      productVariant: {
        include: {
          product: {
            include: {
              images: { orderBy: { displayOrder: 'asc' as const } },
            },
          },
        },
      },
      bespokePerfume: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export type CartItemWithRelations = CartItem & {
  productVariant:
    | (ProductVariant & {
        product: Product & {
          images: ProductImage[];
        };
      })
    | null;
  bespokePerfume: BespokePerfume | null;
};

export type CartWithItems = Cart & {
  items: CartItemWithRelations[];
};

/** @deprecated Prefer CartItemWithRelations */
export type CartItemWithVariant = CartItemWithRelations;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCustomerId(customerId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { customerId },
      include: cartInclude,
    });
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

  async upsertItem(
    cartId: string,
    productVariantId: string,
    quantity: number,
  ): Promise<void> {
    await this.prisma.cartItem.upsert({
      where: {
        cartId_productVariantId: {
          cartId,
          productVariantId,
        },
      },
      create: {
        cartId,
        productVariantId,
        quantity,
      },
      update: {
        quantity,
      },
    });
  }

  async upsertBespokeItem(
    cartId: string,
    bespokePerfumeId: string,
    bespokeSizeMl: number,
    quantity: number,
  ): Promise<void> {
    await this.prisma.cartItem.upsert({
      where: {
        cartId_bespokePerfumeId_bespokeSizeMl: {
          cartId,
          bespokePerfumeId,
          bespokeSizeMl,
        },
      },
      create: {
        cartId,
        bespokePerfumeId,
        bespokeSizeMl,
        quantity,
      },
      update: {
        quantity,
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
}
