import type {
  CartItemResponse,
  CartResponse,
  CatalogCartItemResponse,
} from "@ishraqparfums/shared";
import type { GuestCartLine } from "@/lib/cart/guest-cart";
import { SHIPPING_PAISE } from "@/lib/cart/shipping";

export type CartViewLine = {
  key: string;
  kind: "catalog" | "bespoke";
  /** Nest cart item id — null for guest lines. */
  itemId: string | null;
  variantId: string | null;
  quantity: number;
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQty: number | null;
  isAvailable: boolean;
  productName: string;
  productSlug: string;
  collectionName: string | null;
  shortDescription: string | null;
  primaryImageUrl: string | null;
  lineTotalPaise: number;
};

export type CartView = {
  mode: "server" | "guest";
  cartId: string | null;
  lines: CartViewLine[];
  itemCount: number;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
};

export function emptyCartView(mode: "server" | "guest" = "guest"): CartView {
  return {
    mode,
    cartId: null,
    lines: [],
    itemCount: 0,
    subtotalPaise: 0,
    shippingPaise: 0,
    totalPaise: 0,
  };
}

function lineFromCatalog(item: CatalogCartItemResponse): CartViewLine {
  return {
    key: item.id,
    kind: "catalog",
    itemId: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    sizeMl: item.sizeMl,
    pricePaise: item.pricePaise,
    compareAtPricePaise: item.compareAtPricePaise,
    stockQty: item.stockQty,
    isAvailable: item.isAvailable && item.stockQty > 0,
    productName: item.productName,
    productSlug: item.productSlug,
    collectionName: item.collectionName,
    shortDescription: item.shortDescription,
    primaryImageUrl: item.primaryImageUrl,
    lineTotalPaise: item.lineTotalPaise,
  };
}

function lineFromServerItem(item: CartItemResponse): CartViewLine {
  if (item.kind === "bespoke") {
    return {
      key: item.id,
      kind: "bespoke",
      itemId: item.id,
      variantId: null,
      quantity: item.quantity,
      sizeMl: item.sizeMl,
      pricePaise: item.pricePaise,
      compareAtPricePaise: null,
      stockQty: null,
      isAvailable: true,
      productName: item.productName,
      productSlug: item.productSlug,
      collectionName: "Bespoke",
      shortDescription: null,
      primaryImageUrl: item.primaryImageUrl,
      lineTotalPaise: item.lineTotalPaise,
    };
  }
  return lineFromCatalog(item);
}

export function cartViewFromServer(cart: CartResponse): CartView {
  const lines = cart.items.map(lineFromServerItem);
  const subtotalPaise = cart.subtotalPaise;
  const shippingPaise = lines.length > 0 ? SHIPPING_PAISE : 0;
  return {
    mode: "server",
    cartId: cart.id,
    lines,
    itemCount: cart.itemCount,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
  };
}

export function cartViewFromGuest(items: GuestCartLine[]): CartView {
  const lines: CartViewLine[] = items.map((item) => {
    const available = item.stockQty > 0;
    const quantity = available
      ? Math.min(item.quantity, item.stockQty)
      : item.quantity;
    return {
      key: item.variantId,
      kind: "catalog",
      itemId: null,
      variantId: item.variantId,
      quantity,
      sizeMl: item.sizeMl,
      pricePaise: item.pricePaise,
      compareAtPricePaise: item.compareAtPricePaise,
      stockQty: item.stockQty,
      isAvailable: available,
      productName: item.productName,
      productSlug: item.productSlug,
      collectionName: item.collectionName,
      shortDescription: item.shortDescription,
      primaryImageUrl: item.primaryImageUrl,
      lineTotalPaise: item.pricePaise * quantity,
    };
  });

  const subtotalPaise = lines
    .filter((line) => line.isAvailable)
    .reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const hasSellable = lines.some((line) => line.isAvailable);
  const shippingPaise = hasSellable ? SHIPPING_PAISE : 0;

  return {
    mode: "guest",
    cartId: null,
    lines,
    itemCount,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
  };
}

export function cartHasSellableLines(view: CartView): boolean {
  return view.lines.some((line) => line.isAvailable && line.quantity > 0);
}

export function findCartLineByVariantId(
  view: CartView,
  variantId: string,
): CartViewLine | null {
  return view.lines.find((line) => line.variantId === variantId) ?? null;
}

/**
 * Recompute cart sums from a line list (optimistic local updates).
 */
function withLines(view: CartView, lines: CartViewLine[]): CartView {
  const subtotalPaise = lines
    .filter((line) => line.isAvailable)
    .reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const hasSellable = lines.some(
    (line) => line.isAvailable && line.quantity > 0,
  );
  const shippingPaise = hasSellable ? SHIPPING_PAISE : 0;

  return {
    ...view,
    lines,
    itemCount,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
  };
}

/**
 * Local qty change for optimistic UI — recomputes line totals and cart sums.
 * Quantity ≤ 0 drops the line.
 */
export function withLineQuantity(
  view: CartView,
  lineKey: string,
  quantity: number,
): CartView {
  const lines =
    quantity <= 0
      ? view.lines.filter((line) => line.key !== lineKey)
      : view.lines.map((line) => {
          if (line.key !== lineKey) return line;
          return {
            ...line,
            quantity,
            lineTotalPaise: line.pricePaise * quantity,
          };
        });

  return withLines(view, lines);
}

/**
 * Put a removed line back for Undo — inserts if missing, else resets qty.
 */
export function withLineRestored(
  view: CartView,
  line: CartViewLine,
): CartView {
  const restored: CartViewLine = {
    ...line,
    lineTotalPaise: line.pricePaise * line.quantity,
  };

  if (view.lines.some((item) => item.key === line.key)) {
    return withLineQuantity(view, line.key, line.quantity);
  }

  return withLines(view, [...view.lines, restored]);
}
