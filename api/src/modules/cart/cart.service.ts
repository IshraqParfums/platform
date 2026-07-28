import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CartMergeResponse, CartResponse } from '@ishraqparfums/shared';
import { BespokePricingService } from '../bespoke/bespoke-pricing.service';
import { BespokeService } from '../bespoke/bespoke.service';
import { ProductService } from '../product/product.service';
import { CartRepository } from './cart.repository';
import { toCartResponse } from './mappers/cart.mapper';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productService: ProductService,
    private readonly bespokeService: BespokeService,
    private readonly bespokePricing: BespokePricingService,
  ) {}

  async getCart(customerId: string): Promise<CartResponse> {
    const cart = await this.cartRepository.findOrCreateByCustomerId(customerId);
    return this.mapCart(cart);
  }

  async addItem(
    customerId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartResponse> {
    const variant = await this.productService.findPurchasableVariant(variantId);
    const cart = await this.cartRepository.findOrCreateByCustomerId(customerId);
    const existing = await this.cartRepository.findItemByCartAndVariant(
      cart.id,
      variantId,
    );

    const desiredQuantity = (existing?.quantity ?? 0) + quantity;
    this.productService.assertQuantityAvailable(variant, desiredQuantity);

    await this.cartRepository.upsertItem(cart.id, variantId, desiredQuantity);

    return this.reloadCart(cart.id);
  }

  async addBespokeItem(
    customerId: string,
    bespokePerfumeId: string,
    sizeMl: number,
    quantity: number,
  ): Promise<CartResponse> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be at least 1');
    }

    this.bespokePricing.assertAllowedSize(sizeMl);
    await this.bespokeService.requireOwned(customerId, bespokePerfumeId);

    const cart = await this.cartRepository.findOrCreateByCustomerId(customerId);
    const existing = await this.cartRepository.findItemByCartBespokeSize(
      cart.id,
      bespokePerfumeId,
      sizeMl,
    );

    const desiredQuantity = (existing?.quantity ?? 0) + quantity;
    await this.cartRepository.upsertBespokeItem(
      cart.id,
      bespokePerfumeId,
      sizeMl,
      desiredQuantity,
    );

    return this.reloadCart(cart.id);
  }

  async updateItem(
    customerId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartResponse> {
    const item = await this.findCustomerItemOrThrow(customerId, itemId);

    if (item.bespokePerfumeId) {
      await this.cartRepository.updateItemQuantity(itemId, quantity);
      return this.reloadCart(item.cartId);
    }

    if (!item.productVariantId) {
      throw new BadRequestException('Cart item is invalid');
    }

    const variant = await this.productService.findPurchasableVariant(
      item.productVariantId,
    );

    this.productService.assertQuantityAvailable(variant, quantity);
    await this.cartRepository.updateItemQuantity(itemId, quantity);

    return this.reloadCart(item.cartId);
  }

  async removeItem(customerId: string, itemId: string): Promise<CartResponse> {
    const item = await this.findCustomerItemOrThrow(customerId, itemId);
    await this.cartRepository.deleteItem(itemId);
    return this.reloadCart(item.cartId);
  }

  async merge(
    customerId: string,
    guestItems: Array<{ variantId: string; quantity: number }>,
  ): Promise<CartMergeResponse> {
    const warnings: string[] = [];

    if (guestItems.length === 0) {
      const cart = await this.getCart(customerId);
      return { cart, warnings };
    }

    const cart = await this.cartRepository.findOrCreateByCustomerId(customerId);

    for (const guestItem of guestItems) {
      const normalizedQuantity = Math.trunc(guestItem.quantity);

      if (normalizedQuantity < 1) {
        warnings.push(
          `Skipped variant ${guestItem.variantId}: quantity must be at least 1`,
        );
        continue;
      }

      let variant;

      try {
        variant = await this.productService.findPurchasableVariant(
          guestItem.variantId,
        );
      } catch (error) {
        warnings.push(this.formatMergeWarning(guestItem.variantId, error));
        continue;
      }

      if (this.productService.availableQty(variant) < 1) {
        warnings.push(
          `Skipped ${variant.product.name} (${variant.sizeMl}ml): out of stock`,
        );
        continue;
      }

      const existing = await this.cartRepository.findItemByCartAndVariant(
        cart.id,
        guestItem.variantId,
      );
      const desiredQuantity = (existing?.quantity ?? 0) + normalizedQuantity;
      let finalQuantity = desiredQuantity;
      const available = this.productService.availableQty(variant);

      if (desiredQuantity > available) {
        finalQuantity = available;
        warnings.push(
          `Quantity for ${variant.product.name} (${variant.sizeMl}ml) reduced to ${available} (stock limit)`,
        );
      }

      await this.cartRepository.upsertItem(
        cart.id,
        guestItem.variantId,
        finalQuantity,
      );
    }

    const updatedCart = await this.reloadCart(cart.id);
    return { cart: updatedCart, warnings };
  }

  private formatMergeWarning(variantId: string, error: unknown): string {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      const response = error.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message.join(', ') : message;
      }
    }

    return `Variant ${variantId} could not be added`;
  }

  private async findCustomerItemOrThrow(
    customerId: string,
    itemId: string,
  ): Promise<{
    id: string;
    cartId: string;
    productVariantId: string | null;
    bespokePerfumeId: string | null;
  }> {
    const item = await this.cartRepository.findItemById(itemId);

    if (!item) {
      throw new NotFoundException(`Cart item with id "${itemId}" not found`);
    }

    const cart = await this.cartRepository.findByCustomerId(customerId);

    if (!cart || cart.id !== item.cartId) {
      throw new NotFoundException(`Cart item with id "${itemId}" not found`);
    }

    return item;
  }

  private mapCart(
    cart: Awaited<ReturnType<CartRepository['findByIdWithItems']>>,
  ): CartResponse {
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return toCartResponse(cart, (sizeMl) =>
      this.bespokePricing.unitPricePaise(sizeMl),
    );
  }

  private async reloadCart(cartId: string): Promise<CartResponse> {
    const cart = await this.cartRepository.findByIdWithItems(cartId);
    return this.mapCart(cart);
  }

  async clearCart(customerId: string): Promise<void> {
    const cart = await this.cartRepository.findByCustomerId(customerId);

    if (!cart) {
      return;
    }

    await this.cartRepository.clearItems(cart.id);
  }
}
