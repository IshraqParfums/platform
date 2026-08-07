"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BESPOKE_PAISE_PER_ML,
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
  bespokeSizeQuantitiesInCart,
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
) {
  const [view, setView] = useState<CartView | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const viewRef = useRef<CartView | null>(null);
  viewRef.current = view;

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
                quantity,
              }),
            },
          );

          if (response.status === 401) {
            window.location.href = `/login?next=${encodeURIComponent(
              `/bespoke/brews/${bespokePerfumeId}`,
            )}`;
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
      const line = findCartLineByBespokeSize(view, bespokePerfumeId, sizeMl);
      if (!line?.itemId) {
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
