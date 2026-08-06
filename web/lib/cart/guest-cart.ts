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

export type GuestCartLine = GuestCartSnapshot & {
  variantId: string;
  quantity: number;
};

export type GuestCart = {
  items: GuestCartLine[];
  updatedAt: string;
};

function emptyCart(): GuestCart {
  return { items: [], updatedAt: new Date().toISOString() };
}

function isValidSnapshotLine(line: unknown): line is GuestCartLine {
  if (typeof line !== "object" || line === null) return false;
  const row = line as Record<string, unknown>;
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

function normalizeLine(line: GuestCartLine): GuestCartLine {
  return {
    ...line,
    collectionName: line.collectionName ?? null,
    shortDescription: line.shortDescription ?? null,
  };
}

export function readGuestCart(): GuestCart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as GuestCart;
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    return {
      // Drop legacy lines that lack snapshots — they cannot render.
      items: parsed.items.filter(isValidSnapshotLine).map(normalizeLine),
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
    (line) => line.variantId === snapshot.variantId,
  );
  if (existing) {
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
    cart.items.push({ ...snapshot, quantity: qty });
  }
  writeGuestCart(cart);
  return cart;
}

export function setGuestCartQuantity(
  variantId: string,
  quantity: number,
): GuestCart {
  const cart = readGuestCart();
  const line = cart.items.find((item) => item.variantId === variantId);
  if (!line) return cart;

  const max = Math.max(1, line.stockQty);
  const next = Math.min(max, Math.max(1, Math.floor(quantity)));
  line.quantity = next;
  writeGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(variantId: string): GuestCart {
  const cart = readGuestCart();
  cart.items = cart.items.filter((line) => line.variantId !== variantId);
  writeGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  writeGuestCart(emptyCart());
}

export function guestCartItemCount(cart: GuestCart = readGuestCart()): number {
  return cart.items.reduce((sum, line) => sum + line.quantity, 0);
}
