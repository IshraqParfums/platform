"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "@/components/ui/toaster";
import {
  applyCartMutationSummary,
  type CartLineSeed,
} from "@/lib/cart/apply-cart-mutation-summary";
import {
  emptyCartView,
  isCartMutationSummary,
  loadCart,
  mutateCartItemQuantity,
  mutateCartItemRemove,
  removeCartLine,
  setCartLineQuantity,
} from "@/lib/cart/cart-client";
import { emitCartChanged, subscribeCartChanged } from "@/lib/cart/cart-events";
import {
  findCartLineByVariantId,
  withLineQuantity,
  type CartView,
  type CartViewLine,
} from "@/lib/cart/cart-view";

/**
 * Tracks the cart line for a catalog variant (guest or server).
 * Reacts to `ishraq:cart-changed` so PDP steppers stay in sync with /cart.
 * Qty mutations use `view=summary` — no fat cart reload on the PDP.
 */
export function useCartVariantLine(variantId: string | null) {
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

  const line: CartViewLine | null =
    variantId && view ? findCartLineByVariantId(view, variantId) : null;

  /**
   * Merge a slim mutation ack. Emit outside setState — subscribers call
   * setState and must not run inside another component's updater/render.
   */
  const applySummary = useCallback(
    (
      summary: Parameters<typeof applyCartMutationSummary>[1],
      seed?: CartLineSeed,
    ) => {
      const next = applyCartMutationSummary(
        viewRef.current ?? emptyCartView("server"),
        summary,
        seed,
      );
      viewRef.current = next;
      setView(next);
      emitCartChanged({ itemCount: next.itemCount, view: next });
    },
    [],
  );

  const setQuantity = useCallback(
    (quantity: number) => {
      if (!view || !line) return;

      const currentView = view;
      const currentLine = line;
      const optimistic = withLineQuantity(
        currentView,
        currentLine.key,
        quantity,
      );
      viewRef.current = optimistic;
      setView(optimistic);
      emitCartChanged({ itemCount: optimistic.itemCount, view: optimistic });

      startTransition(async () => {
        try {
          if (currentView.mode === "guest") {
            const next =
              quantity <= 0
                ? await removeCartLine(currentLine, "guest")
                : await setCartLineQuantity(
                    currentLine,
                    quantity,
                    "guest",
                  );
            viewRef.current = next;
            setView(next);
            return;
          }

          if (!currentLine.itemId) {
            throw new Error("Missing cart item id");
          }

          const result =
            quantity <= 0
              ? await mutateCartItemRemove(currentLine.itemId, "summary")
              : await mutateCartItemQuantity(
                  currentLine.itemId,
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
    [view, line, refresh],
  );

  return {
    ready,
    pending: isPending,
    mode: view?.mode ?? "guest",
    line,
    quantity: line?.quantity ?? 0,
    setQuantity,
    applySummary,
    refresh,
  };
}
