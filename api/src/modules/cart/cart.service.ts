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
import {
  DEFAULT_CART_MUTATION_VIEW,
  BESPOKE_MAX_LINE_QUANTITY,
  clampCatalogLineQuantity,
} from '@ishraqparfums/shared';
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
    position?: number,
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
      existing ? undefined : position,
    );

    return this.respondAfterWrite(
      {
        cartId,
        itemId: item.id,
        quantity: item.quantity,
        lineTotalPaise: variant.pricePaise * item.quantity,
        stockQty: this.productService.availableQty(variant),
        variantId,
        position: item.position,
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
    sessionTokens: string[] = [],
    position?: number,
  ): Promise<CartMutationResult> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be at least 1');
    }

    this.bespokePricing.assertAllowedSize(sizeMl);
    await this.bespokeService.requireOwnedOrAttach(
      customerId,
      bespokePerfumeId,
      sessionTokens,
    );

    const cartId = await this.cartRepository.findOrCreateCartId(customerId);
    const existing = await this.cartRepository.findItemByCartBespokeSize(
      cartId,
      bespokePerfumeId,
      sizeMl,
    );

    const desiredQuantity = (existing?.quantity ?? 0) + quantity;
    this.bespokePricing.assertLineQuantity(desiredQuantity);
    const item = await this.cartRepository.upsertBespokeItem(
      cartId,
      bespokePerfumeId,
      sizeMl,
      desiredQuantity,
      existing ? undefined : position,
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
        position: item.position,
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
    const owned = await this.cartRepository.findOwnedItem(customerId, itemId);
    if (owned?.bespokePerfumeId && quantity > 0) {
      this.bespokePricing.assertLineQuantity(quantity);
    }
    // Catalog stock is enforced atomically in the UPDATE below, but the
    // per-order cap has no stock row to hang off — so it is checked here.
    if (owned?.productVariantId && quantity > 0) {
      this.productService.assertWithinLineLimit(quantity);
    }

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
      const cartId = await this.cartRepository.findOrCreateCartId(customerId);
      if (view === 'summary') {
        const itemCount = await this.cartRepository.sumItemQuantities(cartId);
        const summary: CartMutationSummary = {
          cartId,
          itemId,
          quantity: 0,
          itemCount,
          lineTotalPaise: null,
          stockQty: null,
          variantId: null,
          bespokePerfumeId: null,
          sizeMl: null,
        };
        return summary;
      }
      return this.reloadCart(cartId);
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
    bespokeItems: Array<{
      bespokePerfumeId: string;
      sizeMl: number;
      quantity: number;
    }> = [],
    sessionTokens: string[] = [],
  ): Promise<CartMergeResponse> {
    const warnings: string[] = [];

    if (guestItems.length === 0 && bespokeItems.length === 0) {
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
      const available = this.productService.availableQty(variant);
      // Clamp rather than throw: signing in must not fail over a guest cart.
      const finalQuantity = clampCatalogLineQuantity(
        desiredQuantity,
        available,
      );

      if (finalQuantity < desiredQuantity) {
        warnings.push(
          desiredQuantity > available
            ? `Quantity for variant ${guestItem.variantId} reduced to ${finalQuantity} (stock limit)`
            : `Quantity for variant ${guestItem.variantId} reduced to ${finalQuantity} (per-order limit)`,
        );
      }

      await this.cartRepository.upsertItem(
        cartId,
        guestItem.variantId,
        finalQuantity,
      );
    }

    for (const guestItem of bespokeItems) {
      const normalizedQuantity = Math.trunc(guestItem.quantity);
      if (normalizedQuantity < 1) {
        warnings.push(
          `Skipped blend ${guestItem.bespokePerfumeId}: quantity must be at least 1`,
        );
        continue;
      }

      try {
        this.bespokePricing.assertAllowedSize(guestItem.sizeMl);
        await this.bespokeService.requireOwnedOrAttach(
          customerId,
          guestItem.bespokePerfumeId,
          sessionTokens,
        );
      } catch (error) {
        warnings.push(
          this.formatMergeWarning(guestItem.bespokePerfumeId, error),
        );
        continue;
      }

      const existing = await this.cartRepository.findItemByCartBespokeSize(
        cartId,
        guestItem.bespokePerfumeId,
        guestItem.sizeMl,
      );
      let desiredQuantity = (existing?.quantity ?? 0) + normalizedQuantity;
      if (desiredQuantity > BESPOKE_MAX_LINE_QUANTITY) {
        warnings.push(
          `Quantity for blend ${guestItem.bespokePerfumeId} capped at ${BESPOKE_MAX_LINE_QUANTITY}`,
        );
        desiredQuantity = BESPOKE_MAX_LINE_QUANTITY;
      }
      await this.cartRepository.upsertBespokeItem(
        cartId,
        guestItem.bespokePerfumeId,
        guestItem.sizeMl,
        desiredQuantity,
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

    if (owned.bespokePerfumeId && quantity > 0) {
      this.bespokePricing.assertLineQuantity(quantity);
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
      position?: number | null;
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
        position: fields.position ?? null,
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
