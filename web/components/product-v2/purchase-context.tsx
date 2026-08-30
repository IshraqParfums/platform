"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useInView } from "@/components/product-v2/use-in-view";
import {
  maxCatalogLineQuantity,
  type ProductAvailability,
  type ProductDetailVariant,
} from "@ishraqparfums/shared";
import { CartGuestSavedModal } from "@/components/cart/cart-guest-saved-modal";
import { toast } from "@/components/ui/toaster";
import { addToCart } from "@/lib/cart/add-to-cart";
import { toastAddedToCart } from "@/lib/cart/cart-toast";
import {
  hasSeenGuestCartHint,
  markGuestCartHintSeen,
} from "@/lib/cart/guest-cart-hint";
import { useCartVariantLine } from "@/lib/cart/use-cart-variant-line";
import { stockLabel } from "@/lib/catalog/product-stock";
import {
  isVariantSellable,
  pickDefaultVariant,
  sortVariantsBySize,
} from "@/lib/catalog/product-variants";

type CtaState = "idle" | "added" | "error";

export type PurchaseProductMeta = {
  name: string;
  slug: string;
  collectionName: string | null;
  shortDescription: string | null;
  primaryImageUrl: string | null;
};

/**
 * Every buy surface on the page reads from one instance of this.
 *
 * The v1 PDP kept all of this inside the purchase panel, which was fine when
 * the panel was the only place you could buy. v2 has three: the panel in the
 * arrival, the sticky mobile bar, and the closing row at the end of the craft
 * chapter — and they sit in different bands, far apart in the tree. Giving
 * each its own `addToCart` would mean three copies of the money path and
 * three selected-variant states that could disagree, so the state lives here
 * and the surfaces are presentational.
 *
 * The cart/guest-modal/stock logic below is ported verbatim from
 * `product/product-purchase-panel.tsx` — only its *location* changed.
 */
type PurchaseValue = {
  ordered: ProductDetailVariant[];
  selected: ProductDetailVariant | null;
  selectVariant: (id: string) => void;
  availability: ProductAvailability;
  purchasable: boolean;
  stock: ReturnType<typeof stockLabel>;
  inCart: boolean;
  cartQty: number;
  setCartQty: (quantity: number) => void;
  cartPending: boolean;
  cartReady: boolean;
  /** Qty in cart per variant id — size pickers badge each size with this. */
  variantQuantities: Record<string, number>;
  maxQty: number | undefined;
  isPending: boolean;
  ctaState: CtaState;
  errorMessage: string | null;
  addSelectedToCart: () => void;
  product: PurchaseProductMeta;
  /** The arrival's CTA block registers itself here; the sticky bar watches it. */
  setBuyAnchor: (element: HTMLElement | null) => void;
  /**
   * True while the sticky bar should stay out of the way — either the
   * arrival's own CTA is still on screen, or the reader has reached the end
   * of the product content and the footer is coming up.
   */
  buyBarSuppressed: boolean;
  /** The end-of-content sentinel registers itself here. */
  setEndAnchor: (element: HTMLElement | null) => void;
};

const PurchaseContext = createContext<PurchaseValue | null>(null);

export function useProductPurchase(): PurchaseValue {
  const value = useContext(PurchaseContext);
  if (!value) {
    throw new Error(
      "useProductPurchase must be used inside <ProductPurchaseProvider>",
    );
  }
  return value;
}

function purchaseErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  if (/isn['']t available to buy/i.test(raw) || /not available for purchase/i.test(raw)) {
    return "This fragrance isn't available to buy right now.";
  }
  if (/out of stock/i.test(raw)) {
    return "That size just sold out. Try another size or check back soon.";
  }
  if (/isn['']t available right now|currently unavailable/i.test(raw)) {
    return "That size isn't available right now.";
  }
  return raw || "Could not add to cart";
}

export function ProductPurchaseProvider({
  variants,
  product,
  availability,
  children,
}: {
  variants: ProductDetailVariant[];
  product: PurchaseProductMeta;
  availability: ProductAvailability;
  children: ReactNode;
}) {
  const ordered = useMemo(() => sortVariantsBySize(variants), [variants]);
  const [selectedId, setSelectedId] = useState(
    () => pickDefaultVariant(variants)?.id ?? "",
  );
  const [ctaState, setCtaState] = useState<CtaState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // The arrival's CTA is on screen at mount by definition, so this starts
  // true and the bar never flashes in before the first observer callback.
  const { setNode: setBuyAnchor, inView: buyInView } = useInView(true);
  // The end sentinel sits below the fold at mount, so it starts false. It
  // latches past (`includePassed`) so the bar stays retired while the footer
  // is on screen instead of reappearing over it.
  const { setNode: setEndAnchor, inView: endReached } = useInView(false, {
    includePassed: true,
  });

  const selected =
    ordered.find((variant) => variant.id === selectedId) ??
    pickDefaultVariant(ordered);

  const {
    ready: cartReady,
    pending: cartPending,
    quantity: cartQty,
    variantQuantities,
    setQuantity: setCartQty,
    applySummary,
  } = useCartVariantLine(selected?.id ?? null);

  const sizeSellable = selected ? isVariantSellable(selected) : false;
  const purchasable = availability === "AVAILABLE" && sizeSellable;
  const stock = stockLabel(selected);
  const inCart = cartReady && cartQty > 0;
  const maxQty =
    selected && selected.stockQty > 0
      ? maxCatalogLineQuantity(selected.stockQty)
      : undefined;

  const closeGuestModal = useCallback(() => {
    setGuestModalOpen(false);
  }, []);

  const selectVariant = useCallback((id: string) => {
    setSelectedId(id);
    setCtaState("idle");
    setErrorMessage(null);
  }, []);

  function addSelectedToCart() {
    if (!selected || !purchasable) return;
    setErrorMessage(null);
    setCtaState("idle");

    startTransition(async () => {
      try {
        const result = await addToCart({
          variantId: selected.id,
          productName: product.name,
          productSlug: product.slug,
          collectionName: product.collectionName,
          shortDescription: product.shortDescription,
          sizeMl: selected.sizeMl,
          pricePaise: selected.pricePaise,
          compareAtPricePaise: selected.compareAtPricePaise,
          primaryImageUrl: product.primaryImageUrl,
          stockQty: selected.stockQty,
        });

        if (result.mode === "guest") {
          if (!hasSeenGuestCartHint()) {
            markGuestCartHintSeen();
            setGuestModalOpen(true);
            return;
          }
          toastAddedToCart(product.name);
          return;
        }

        applySummary(result.summary, {
          variantId: selected.id,
          productName: product.name,
          productSlug: product.slug,
          collectionName: product.collectionName,
          shortDescription: product.shortDescription,
          sizeMl: selected.sizeMl,
          pricePaise: selected.pricePaise,
          compareAtPricePaise: selected.compareAtPricePaise,
          primaryImageUrl: product.primaryImageUrl,
          stockQty: selected.stockQty,
        });
        toastAddedToCart(product.name);
        setCtaState("added");
        window.setTimeout(() => setCtaState("idle"), 2200);
      } catch (error) {
        setCtaState("error");
        const message = purchaseErrorMessage(error);
        setErrorMessage(message);
        toast.error("Could not add to cart", message);
      }
    });
  }

  return (
    <PurchaseContext.Provider
      value={{
        ordered,
        selected,
        selectVariant,
        availability,
        purchasable,
        stock,
        inCart,
        cartQty,
        setCartQty,
        cartPending,
        cartReady,
        variantQuantities,
        maxQty,
        isPending,
        ctaState,
        errorMessage,
        addSelectedToCart,
        product,
        setBuyAnchor,
        setEndAnchor,
        buyBarSuppressed: buyInView || endReached,
      }}
    >
      {children}
      {/* One modal for the whole page, not one per buy surface. */}
      <CartGuestSavedModal open={guestModalOpen} onClose={closeGuestModal} />
    </PurchaseContext.Provider>
  );
}
