"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BESPOKE_PAISE_PER_ML,
  clampBespokeLineQuantity,
  isCartMutationSummary,
} from "@ishraqparfums/shared";
import { toast } from "@/components/ui/toaster";
import {
  applyCartMutationSummary,
  type BespokeCartLineSeed,
} from "@/lib/cart/apply-cart-mutation-summary";
import {
  emptyCartView,
  loadCart,
  mutateCartItemQuantity,
  mutateCartItemRemove,
} from "@/lib/cart/cart-client";
import { emitCartChanged, subscribeCartChanged } from "@/lib/cart/cart-events";
import {
  addGuestBespokeItem,
  guestCartItemCount,
  readGuestCart,
  setGuestBespokeQuantity,
} from "@/lib/cart/guest-cart";
import {
  bespokeSizeQuantitiesInCart,
  cartViewFromGuest,
  findCartLineByBespokeSize,
  withLineQuantity,
  type CartView,
} from "@/lib/cart/cart-view";
import { shopFetch } from "@/lib/auth/shop-fetch";

/**
 * Tracks cart lines for one owned bespoke brew across bottle sizes.
 * Mirrors `useCartVariantLine` but keys on bespokePerfumeId + sizeMl.
 */
export function useCartBespokeLine(
  bespokePerfumeId: string | null,
  productName: string,
  options?: { onGuestAdd?: () => void },
) {
  const [view, setView] = useState<CartView | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const viewRef = useRef<CartView | null>(null);
  viewRef.current = view;
  const onGuestAddRef = useRef(options?.onGuestAdd);
  onGuestAddRef.current = options?.onGuestAdd;

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        setView(await loadCart());
      } catch {
        setView(emptyCartView());
      } finally {
        setReady(true);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCartChanged((detail) => {
      if (detail.view) {
        setView(detail.view);
        return;
      }
      void loadCart()
        .then(setView)
        .catch(() => setView(emptyCartView()));
    });
  }, [refresh]);

  const sizeQuantities = bespokePerfumeId
    ? bespokeSizeQuantitiesInCart(view, bespokePerfumeId)
    : {};

  function lineForSize(sizeMl: number) {
    if (!bespokePerfumeId || !view) return null;
    return findCartLineByBespokeSize(view, bespokePerfumeId, sizeMl);
  }

  const addSize = useCallback(
    (sizeMl: number, quantity = 1) => {
      if (!bespokePerfumeId) return;

      const current = viewRef.current
        ? (bespokeSizeQuantitiesInCart(
            viewRef.current,
            bespokePerfumeId,
          )[sizeMl] ?? 0)
        : 0;
      const nextTotal = clampBespokeLineQuantity(current + quantity);
      const addQty = nextTotal - current;
      if (addQty < 1) return;

      startTransition(async () => {
        try {
          const response = await shopFetch(
            "/api/cart/items/bespoke?view=summary",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bespokePerfumeId,
                sizeMl,
                quantity: addQty,
              }),
            },
          );

          if (response.status === 401) {
            addGuestBespokeItem(
              {
                bespokePerfumeId,
                sizeMl,
                pricePaise: sizeMl * BESPOKE_PAISE_PER_ML,
                productName,
              },
              addQty,
            );
            const next = cartViewFromGuest(readGuestCart().items);
            viewRef.current = next;
            setView(next);
            emitCartChanged({ itemCount: guestCartItemCount(), view: next });
            onGuestAddRef.current?.();
            return;
          }

          if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as {
              message?: string;
            };
            throw new Error(body.message ?? "Could not add to cart");
          }

          const result = await response.json();
          if (!isCartMutationSummary(result)) {
            throw new Error("Expected cart mutation summary");
          }

          const seed: BespokeCartLineSeed = {
            bespokePerfumeId,
            sizeMl,
            pricePaise: sizeMl * BESPOKE_PAISE_PER_ML,
            productName,
          };
          const next = applyCartMutationSummary(
            viewRef.current ?? emptyCartView("server"),
            result,
            undefined,
            seed,
          );
          viewRef.current = next;
          setView(next);
          emitCartChanged({ itemCount: next.itemCount, view: next });
        } catch (err) {
          toast.error(
            "Could not add to cart",
            err instanceof Error ? err.message : "Please try again",
          );
          refresh();
        }
      });
    },
    [bespokePerfumeId, productName, refresh],
  );

  const setSizeQuantity = useCallback(
    (sizeMl: number, quantity: number) => {
      if (!bespokePerfumeId || !view) return;
      quantity = clampBespokeLineQuantity(quantity);
      const line = findCartLineByBespokeSize(view, bespokePerfumeId, sizeMl);
      if (!line?.itemId) {
        if (view.mode === "guest" && bespokePerfumeId) {
          setGuestBespokeQuantity(bespokePerfumeId, sizeMl, quantity);
          const next = cartViewFromGuest(readGuestCart().items);
          viewRef.current = next;
          setView(next);
          emitCartChanged({ itemCount: next.itemCount, view: next });
          return;
        }
        if (quantity > 0) addSize(sizeMl, quantity);
        return;
      }

      const currentView = view;
      const optimistic = withLineQuantity(currentView, line.key, quantity);
      viewRef.current = optimistic;
      setView(optimistic);
      emitCartChanged({ itemCount: optimistic.itemCount, view: optimistic });

      startTransition(async () => {
        try {
          const result =
            quantity <= 0
              ? await mutateCartItemRemove(line.itemId!, "summary")
              : await mutateCartItemQuantity(
                  line.itemId!,
                  quantity,
                  "summary",
                );

          if (!isCartMutationSummary(result)) {
            throw new Error("Expected cart mutation summary");
          }

          const next = applyCartMutationSummary(currentView, result);
          viewRef.current = next;
          setView(next);
          emitCartChanged({ itemCount: next.itemCount, view: next });
        } catch (err) {
          toast.error(
            "Could not update cart",
            err instanceof Error ? err.message : "Update failed",
          );
          refresh();
        }
      });
    },
    [bespokePerfumeId, view, addSize, refresh],
  );

  return {
    ready,
    pending: isPending,
    sizeQuantities,
    quantityForSize: (sizeMl: number) => sizeQuantities[sizeMl] ?? 0,
    lineForSize,
    addSize,
    setSizeQuantity,
    refresh,
  };
}
