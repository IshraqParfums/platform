import type {
  CartItemResponse,
  CartResponse,
  CartUnavailableReason,
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
  bespokePerfumeId: string | null;
  quantity: number;
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQty: number | null;
  isAvailable: boolean;
  unavailableReason: CartUnavailableReason | null;
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
    bespokePerfumeId: null,
    quantity: item.quantity,
    sizeMl: item.sizeMl,
    pricePaise: item.pricePaise,
    compareAtPricePaise: item.compareAtPricePaise,
    stockQty: item.stockQty,
    isAvailable: item.isAvailable,
    unavailableReason: item.unavailableReason,
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
      bespokePerfumeId: item.bespokePerfumeId,
      quantity: item.quantity,
      sizeMl: item.sizeMl,
      pricePaise: item.pricePaise,
      compareAtPricePaise: null,
      stockQty: null,
      isAvailable: item.isAvailable,
      unavailableReason: item.unavailableReason,
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

/** Shared totals — available lines only. Used by guest, server, and optimistic paths. */
export function cartTotalsFromLines(lines: CartViewLine[]): {
  itemCount: number;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
} {
  const subtotalPaise = lines
    .filter((line) => line.isAvailable)
    .reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const hasSellable = lines.some(
    (line) => line.isAvailable && line.quantity > 0,
  );
  const shippingPaise = hasSellable ? SHIPPING_PAISE : 0;
  return {
    itemCount,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
  };
}

export function cartViewFromServer(cart: CartResponse): CartView {
  const lines = cart.items.map(lineFromServerItem);
  const totals = cartTotalsFromLines(lines);
  return {
    mode: "server",
    cartId: cart.id,
    lines,
    ...totals,
  };
}

export function cartViewFromGuest(items: GuestCartLine[]): CartView {
  const lines: CartViewLine[] = items.map((item) => {
    if (item.kind === "bespoke") {
      return {
        key: `bespoke:${item.bespokePerfumeId}:${item.sizeMl}`,
        kind: "bespoke" as const,
        itemId: null,
        variantId: null,
        bespokePerfumeId: item.bespokePerfumeId,
        quantity: item.quantity,
        sizeMl: item.sizeMl,
        pricePaise: item.pricePaise,
        compareAtPricePaise: null,
        stockQty: null,
        isAvailable: true,
        unavailableReason: null,
        productName: item.productName,
        productSlug: "bespoke",
        collectionName: "Bespoke",
        shortDescription: null,
        primaryImageUrl: null,
        lineTotalPaise: item.pricePaise * item.quantity,
      };
    }

    const available = item.stockQty > 0;
    const quantity = available
      ? Math.min(item.quantity, item.stockQty)
      : item.quantity;
    return {
      key: item.variantId,
      kind: "catalog" as const,
      itemId: null,
      variantId: item.variantId,
      bespokePerfumeId: null,
      quantity,
      sizeMl: item.sizeMl,
      pricePaise: item.pricePaise,
      compareAtPricePaise: item.compareAtPricePaise,
      stockQty: item.stockQty,
      isAvailable: available,
      unavailableReason: available ? null : ("OUT_OF_STOCK" as const),
      productName: item.productName,
      productSlug: item.productSlug,
      collectionName: item.collectionName,
      shortDescription: item.shortDescription,
      primaryImageUrl: item.primaryImageUrl,
      lineTotalPaise: item.pricePaise * quantity,
    };
  });

  return {
    mode: "guest",
    cartId: null,
    lines,
    ...cartTotalsFromLines(lines),
  };
}

export function cartHasSellableLines(view: CartView): boolean {
  return view.lines.some((line) => line.isAvailable && line.quantity > 0);
}

export function cartSellableLines(view: CartView): CartViewLine[] {
  return view.lines.filter((line) => line.isAvailable && line.quantity > 0);
}

export function cartUnavailableLines(view: CartView): CartViewLine[] {
  return view.lines.filter((line) => !line.isAvailable);
}

export function findCartLineByVariantId(
  view: CartView,
  variantId: string,
): CartViewLine | null {
  return view.lines.find((line) => line.variantId === variantId) ?? null;
}

export function findCartLineByBespokeSize(
  view: CartView,
  bespokePerfumeId: string,
  sizeMl: number,
): CartViewLine | null {
  return (
    view.lines.find(
      (line) =>
        line.kind === "bespoke" &&
        line.bespokePerfumeId === bespokePerfumeId &&
        line.sizeMl === sizeMl,
    ) ?? null
  );
}

/**
 * Qty already in cart for each catalog variant, keyed by variant id.
 *
 * Keyed on id rather than `sizeMl` because that is the identity buy surfaces
 * already select on, and two variants of one product could share an ml.
 */
export function variantQuantitiesInCart(
  view: CartView | null,
): Record<string, number> {
  if (!view) return {};
  const out: Record<string, number> = {};
  for (const line of view.lines) {
    if (line.kind === "bespoke" || !line.variantId || line.quantity <= 0) {
      continue;
    }
    out[line.variantId] = (out[line.variantId] ?? 0) + line.quantity;
  }
  return out;
}

/** Qty already in cart for each size of a given brew. */
export function bespokeSizeQuantitiesInCart(
  view: CartView | null,
  bespokePerfumeId: string,
): Record<number, number> {
  if (!view) return {};
  const out: Record<number, number> = {};
  for (const line of view.lines) {
    if (
      line.kind === "bespoke" &&
      line.bespokePerfumeId === bespokePerfumeId &&
      line.quantity > 0
    ) {
      out[line.sizeMl] = (out[line.sizeMl] ?? 0) + line.quantity;
    }
  }
  return out;
}

/**
 * Recompute cart sums from a line list (optimistic local updates).
 */
function withLines(view: CartView, lines: CartViewLine[]): CartView {
  return {
    ...view,
    lines,
    ...cartTotalsFromLines(lines),
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

export function cartUnavailableReasonCopy(
  reason: CartUnavailableReason | null,
): string {
  switch (reason) {
    case "DISCONTINUED":
      return "No longer available";
    case "UNAVAILABLE":
      return "Temporarily unavailable";
    case "OUT_OF_STOCK":
      return "Out of stock";
    default:
      return "Currently unavailable";
  }
}
