import { clampBespokeLineQuantity } from "@ishraqparfums/shared";

export const GUEST_CART_STORAGE_KEY = "ishraq_guest_cart_v1";

/** Display fields captured at add-from-PDP time so the cart can render without Nest. */
export type GuestCartSnapshot = {
  productName: string;
  productSlug: string;
  collectionName: string | null;
  shortDescription: string | null;
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  primaryImageUrl: string | null;
  stockQty: number;
};

export type GuestCatalogLine = GuestCartSnapshot & {
  kind?: "catalog";
  variantId: string;
  quantity: number;
};

export type GuestBespokeLine = {
  kind: "bespoke";
  bespokePerfumeId: string;
  quantity: number;
  sizeMl: number;
  pricePaise: number;
  productName: string;
};

export type GuestCartLine = GuestCatalogLine | GuestBespokeLine;

export type GuestCart = {
  items: GuestCartLine[];
  updatedAt: string;
};

function emptyCart(): GuestCart {
  return { items: [], updatedAt: new Date().toISOString() };
}

function isGuestBespokeLine(line: unknown): line is GuestBespokeLine {
  if (typeof line !== "object" || line === null) return false;
  const row = line as Record<string, unknown>;
  return (
    row.kind === "bespoke" &&
    typeof row.bespokePerfumeId === "string" &&
    typeof row.quantity === "number" &&
    row.quantity > 0 &&
    typeof row.sizeMl === "number" &&
    typeof row.pricePaise === "number" &&
    typeof row.productName === "string"
  );
}

function isValidSnapshotLine(line: unknown): line is GuestCatalogLine {
  if (typeof line !== "object" || line === null) return false;
  const row = line as Record<string, unknown>;
  if (row.kind === "bespoke") return false;
  const collectionOk =
    row.collectionName === undefined ||
    row.collectionName === null ||
    typeof row.collectionName === "string";
  const shortDescriptionOk =
    row.shortDescription === undefined ||
    row.shortDescription === null ||
    typeof row.shortDescription === "string";
  return (
    typeof row.variantId === "string" &&
    typeof row.quantity === "number" &&
    row.quantity > 0 &&
    typeof row.productName === "string" &&
    typeof row.productSlug === "string" &&
    collectionOk &&
    shortDescriptionOk &&
    typeof row.sizeMl === "number" &&
    typeof row.pricePaise === "number" &&
    (row.compareAtPricePaise === null ||
      typeof row.compareAtPricePaise === "number") &&
    (row.primaryImageUrl === null || typeof row.primaryImageUrl === "string") &&
    typeof row.stockQty === "number"
  );
}

function normalizeCatalogLine(line: GuestCatalogLine): GuestCatalogLine {
  return {
    ...line,
    kind: "catalog",
    collectionName: line.collectionName ?? null,
    shortDescription: line.shortDescription ?? null,
  };
}

export function isBespokeGuestLine(
  line: GuestCartLine,
): line is GuestBespokeLine {
  return line.kind === "bespoke";
}

export function guestBespokeKey(
  bespokePerfumeId: string,
  sizeMl: number,
): string {
  return `bespoke:${bespokePerfumeId}:${sizeMl}`;
}

export function readGuestCart(): GuestCart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as GuestCart;
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    const items: GuestCartLine[] = [];
    for (const line of parsed.items) {
      if (isGuestBespokeLine(line)) {
        items.push({
          ...line,
          quantity: Math.max(1, clampBespokeLineQuantity(line.quantity)),
        });
      }
      else if (isValidSnapshotLine(line)) items.push(normalizeCatalogLine(line));
    }
    return {
      items,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptyCart();
  }
}

export function writeGuestCart(cart: GuestCart): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    GUEST_CART_STORAGE_KEY,
    JSON.stringify({
      ...cart,
      updatedAt: new Date().toISOString(),
    }),
  );
}

/** Merge quantity into an existing line (refresh snapshot) or append. */
export function addGuestCartItem(
  snapshot: GuestCartSnapshot & { variantId: string },
  quantity = 1,
): GuestCart {
  const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  const cart = readGuestCart();
  const existing = cart.items.find(
    (line) => line.kind !== "bespoke" && line.variantId === snapshot.variantId,
  );
  if (existing && existing.kind !== "bespoke") {
    existing.quantity += qty;
    existing.productName = snapshot.productName;
    existing.productSlug = snapshot.productSlug;
    existing.collectionName = snapshot.collectionName;
    existing.shortDescription = snapshot.shortDescription;
    existing.sizeMl = snapshot.sizeMl;
    existing.pricePaise = snapshot.pricePaise;
    existing.compareAtPricePaise = snapshot.compareAtPricePaise;
    existing.primaryImageUrl = snapshot.primaryImageUrl;
    existing.stockQty = snapshot.stockQty;
  } else {
    cart.items.push({ ...snapshot, kind: "catalog", quantity: qty });
  }
  writeGuestCart(cart);
  return cart;
}

export function addGuestBespokeItem(
  snapshot: Omit<GuestBespokeLine, "kind" | "quantity">,
  quantity = 1,
): GuestCart {
  const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  const cart = readGuestCart();
  const existing = cart.items.find(
    (line): line is GuestBespokeLine =>
      line.kind === "bespoke" &&
      line.bespokePerfumeId === snapshot.bespokePerfumeId &&
      line.sizeMl === snapshot.sizeMl,
  );
  if (existing) {
    existing.quantity = Math.max(
      1,
      clampBespokeLineQuantity(existing.quantity + qty),
    );
    existing.productName = snapshot.productName;
    existing.pricePaise = snapshot.pricePaise;
  } else {
    cart.items.push({
      ...snapshot,
      kind: "bespoke",
      quantity: Math.max(1, clampBespokeLineQuantity(qty)),
    });
  }
  writeGuestCart(cart);
  return cart;
}

export function setGuestCartQuantity(
  variantId: string,
  quantity: number,
): GuestCart {
  const cart = readGuestCart();
  const line = cart.items.find(
    (item) => item.kind !== "bespoke" && item.variantId === variantId,
  );
  if (!line || line.kind === "bespoke") return cart;

  const max = Math.max(1, line.stockQty);
  const next = Math.min(max, Math.max(1, Math.floor(quantity)));
  line.quantity = next;
  writeGuestCart(cart);
  return cart;
}

export function setGuestBespokeQuantity(
  bespokePerfumeId: string,
  sizeMl: number,
  quantity: number,
): GuestCart {
  const cart = readGuestCart();
  const line = cart.items.find(
    (item): item is GuestBespokeLine =>
      item.kind === "bespoke" &&
      item.bespokePerfumeId === bespokePerfumeId &&
      item.sizeMl === sizeMl,
  );
  if (!line) return cart;
  if (quantity < 1) {
    cart.items = cart.items.filter((item) => item !== line);
  } else {
    line.quantity = Math.max(1, clampBespokeLineQuantity(quantity));
  }
  writeGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(variantId: string): GuestCart {
  const cart = readGuestCart();
  cart.items = cart.items.filter(
    (line) => line.kind === "bespoke" || line.variantId !== variantId,
  );
  writeGuestCart(cart);
  return cart;
}

export function removeGuestBespokeItem(
  bespokePerfumeId: string,
  sizeMl: number,
): GuestCart {
  const cart = readGuestCart();
  cart.items = cart.items.filter(
    (line) =>
      line.kind !== "bespoke" ||
      line.bespokePerfumeId !== bespokePerfumeId ||
      line.sizeMl !== sizeMl,
  );
  writeGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  writeGuestCart(emptyCart());
}

export function guestCartItemCount(cart: GuestCart = readGuestCart()): number {
  return cart.items.reduce((sum, line) => sum + line.quantity, 0);
}

export function guestCatalogItems(
  cart: GuestCart = readGuestCart(),
): GuestCatalogLine[] {
  return cart.items.filter(
    (line): line is GuestCatalogLine => line.kind !== "bespoke",
  );
}

export function guestBespokeItems(
  cart: GuestCart = readGuestCart(),
): GuestBespokeLine[] {
  return cart.items.filter(
    (line): line is GuestBespokeLine => line.kind === "bespoke",
  );
}
