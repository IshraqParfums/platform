import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CartMergeResponse,
  CartMutationResult,
  CartMutationSummary,
  CartMutationView,
  CartResponse,
} from '@ishraqparfums/shared';
import { DEFAULT_CART_MUTATION_VIEW } from '@ishraqparfums/shared';
import { BespokePricingService } from '../bespoke/bespoke-pricing.service';
import { BespokeService } from '../bespoke/bespoke.service';
import { ProductService } from '../product/product.service';
import type { OwnedQuantityUpdateRow } from './cart-mutation.types';
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
    view: CartMutationView = DEFAULT_CART_MUTATION_VIEW,
  ): Promise<CartMutationResult> {
    const variant =
      await this.productService.findPurchasableVariantLean(variantId);
    const cartId = await this.cartRepository.findOrCreateCartId(customerId);
    const existing = await this.cartRepository.findItemByCartAndVariant(
      cartId,
      variantId,
    );

    const desiredQuantity = (existing?.quantity ?? 0) + quantity;
    this.productService.assertQuantityAvailable(variant, desiredQuantity);

    const item = await this.cartRepository.upsertItem(
      cartId,
      variantId,
      desiredQuantity,
    );

    return this.respondAfterWrite(
      {
        cartId,
        itemId: item.id,
        quantity: item.quantity,
        lineTotalPaise: variant.pricePaise * item.quantity,
        stockQty: this.productService.availableQty(variant),
        variantId,
      },
      view,
    );
  }

  async addBespokeItem(
    customerId: string,
    bespokePerfumeId: string,
    sizeMl: number,
    quantity: number,
    view: CartMutationView = DEFAULT_CART_MUTATION_VIEW,
  ): Promise<CartMutationResult> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be at least 1');
    }

    this.bespokePricing.assertAllowedSize(sizeMl);
    await this.bespokeService.requireOwned(customerId, bespokePerfumeId);

    const cartId = await this.cartRepository.findOrCreateCartId(customerId);
    const existing = await this.cartRepository.findItemByCartBespokeSize(
      cartId,
      bespokePerfumeId,
      sizeMl,
    );

    const desiredQuantity = (existing?.quantity ?? 0) + quantity;
    const item = await this.cartRepository.upsertBespokeItem(
      cartId,
      bespokePerfumeId,
      sizeMl,
      desiredQuantity,
    );

    const pricePaise = this.bespokePricing.unitPricePaise(sizeMl);
    return this.respondAfterWrite(
      {
        cartId,
        itemId: item.id,
        quantity: item.quantity,
        lineTotalPaise: pricePaise * item.quantity,
        stockQty: null,
        variantId: null,
        bespokePerfumeId,
        sizeMl,
      },
      view,
    );
  }

  async updateItem(
    customerId: string,
    itemId: string,
    quantity: number,
    view: CartMutationView = DEFAULT_CART_MUTATION_VIEW,
  ): Promise<CartMutationResult> {
    const row = await this.cartRepository.updateOwnedItemQuantity(
      customerId,
      itemId,
      quantity,
    );

    if (row) {
      return this.respondFromUpdateRow(row, view);
    }

    return this.recoverFailedQuantityUpdate(
      customerId,
      itemId,
      quantity,
      view,
    );
  }

  async removeItem(
    customerId: string,
    itemId: string,
    view: CartMutationView = DEFAULT_CART_MUTATION_VIEW,
  ): Promise<CartMutationResult> {
    const row = await this.cartRepository.deleteOwnedItem(customerId, itemId);

    if (!row) {
      throw new NotFoundException(`Cart item with id "${itemId}" not found`);
    }

    if (view === 'summary') {
      const summary: CartMutationSummary = {
        cartId: row.cartId,
        itemId: row.id,
        quantity: 0,
        itemCount: Number(row.itemCount),
        lineTotalPaise: null,
        stockQty: null,
        variantId: null,
        bespokePerfumeId: null,
        sizeMl: null,
      };
      return summary;
    }

    return this.reloadCart(row.cartId);
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

    const cartId = await this.cartRepository.findOrCreateCartId(customerId);

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
        variant = await this.productService.findPurchasableVariantLean(
          guestItem.variantId,
        );
      } catch (error) {
        warnings.push(this.formatMergeWarning(guestItem.variantId, error));
        continue;
      }

      if (this.productService.availableQty(variant) < 1) {
        warnings.push(`Skipped variant ${guestItem.variantId}: out of stock`);
        continue;
      }

      const existing = await this.cartRepository.findItemByCartAndVariant(
        cartId,
        guestItem.variantId,
      );
      const desiredQuantity = (existing?.quantity ?? 0) + normalizedQuantity;
      let finalQuantity = desiredQuantity;
      const available = this.productService.availableQty(variant);

      if (desiredQuantity > available) {
        finalQuantity = available;
        warnings.push(
          `Quantity for variant ${guestItem.variantId} reduced to ${available} (stock limit)`,
        );
      }

      await this.cartRepository.upsertItem(
        cartId,
        guestItem.variantId,
        finalQuantity,
      );
    }

    const updatedCart = await this.reloadCart(cartId);
    return { cart: updatedCart, warnings };
  }

  /**
   * One-shot UPDATE matched nothing. Classify not-found vs stock/status
   * (failure path only). If stock is now OK (race), fall back to a plain
   * update and respond.
   */
  private async recoverFailedQuantityUpdate(
    customerId: string,
    itemId: string,
    quantity: number,
    view: CartMutationView,
  ): Promise<CartMutationResult> {
    const owned = await this.cartRepository.findOwnedItem(customerId, itemId);

    if (!owned) {
      throw new NotFoundException(`Cart item with id "${itemId}" not found`);
    }

    if (owned.productVariantId) {
      await this.productService.assertVariantQuantityForCart(
        owned.productVariantId,
        quantity,
      );
    }

    await this.cartRepository.updateItemQuantity(itemId, quantity);

    if (view === 'full') {
      return this.reloadCart(owned.cartId);
    }

    const itemCount = await this.cartRepository.sumItemQuantities(owned.cartId);

    if (owned.productVariantId) {
      const variant = await this.productService.findPurchasableVariantLean(
        owned.productVariantId,
      );
      return {
        cartId: owned.cartId,
        itemId: owned.id,
        quantity,
        itemCount,
        lineTotalPaise: variant.pricePaise * quantity,
        stockQty: this.productService.availableQty(variant),
        variantId: variant.id,
      };
    }

    const sizeMl = owned.bespokeSizeMl;
    const lineTotalPaise =
      sizeMl != null
        ? this.bespokePricing.unitPricePaise(sizeMl) * quantity
        : null;

    return {
      cartId: owned.cartId,
      itemId: owned.id,
      quantity,
      itemCount,
      lineTotalPaise,
      stockQty: null,
      variantId: null,
    };
  }

  private respondFromUpdateRow(
    row: OwnedQuantityUpdateRow,
    view: CartMutationView,
  ): Promise<CartMutationResult> {
    const quantity = Number(row.quantity);
    const itemCount = Number(row.itemCount);
    const availableStock =
      row.availableStock == null ? null : Number(row.availableStock);

    let lineTotalPaise: number | null = null;
    if (row.productVariantId && row.pricePaise != null) {
      lineTotalPaise = Number(row.pricePaise) * quantity;
    } else if (row.bespokePerfumeId && row.bespokeSizeMl != null) {
      lineTotalPaise =
        this.bespokePricing.unitPricePaise(row.bespokeSizeMl) * quantity;
    }

    if (view === 'summary') {
      const summary: CartMutationSummary = {
        cartId: row.cartId,
        itemId: row.id,
        quantity,
        itemCount,
        lineTotalPaise,
        stockQty: availableStock,
        variantId: row.productVariantId,
        bespokePerfumeId: row.bespokePerfumeId,
        sizeMl: row.bespokeSizeMl,
      };
      return Promise.resolve(summary);
    }

    return this.reloadCart(row.cartId);
  }

  private async respondAfterWrite(
    fields: {
      cartId: string;
      itemId: string;
      quantity: number;
      lineTotalPaise: number | null;
      stockQty: number | null;
      variantId: string | null;
      bespokePerfumeId?: string | null;
      sizeMl?: number | null;
    },
    view: CartMutationView,
  ): Promise<CartMutationResult> {
    if (view === 'summary') {
      const itemCount = await this.cartRepository.sumItemQuantities(
        fields.cartId,
      );
      return {
        cartId: fields.cartId,
        itemId: fields.itemId,
        quantity: fields.quantity,
        itemCount,
        lineTotalPaise: fields.lineTotalPaise,
        stockQty: fields.stockQty,
        variantId: fields.variantId,
        bespokePerfumeId: fields.bespokePerfumeId ?? null,
        sizeMl: fields.sizeMl ?? null,
      };
    }

    return this.reloadCart(fields.cartId);
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
