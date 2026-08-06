"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "@/components/ui/toaster";
import {
  emptyCartView,
  loadCart,
  removeCartLine,
  setCartLineQuantity,
} from "@/lib/cart/cart-client";
import { subscribeCartChanged } from "@/lib/cart/cart-events";
import {
  findCartLineByVariantId,
  type CartView,
  type CartViewLine,
} from "@/lib/cart/cart-view";

/**
 * Tracks the cart line for a catalog variant (guest or server).
 * Reacts to `ishraq:cart-changed` so PDP steppers stay in sync with /cart.
 */
export function useCartVariantLine(variantId: string | null) {
  const [view, setView] = useState<CartView | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    return subscribeCartChanged(() => {
      void loadCart()
        .then(setView)
        .catch(() => setView(emptyCartView()));
    });
  }, [refresh]);

  const line: CartViewLine | null =
    variantId && view ? findCartLineByVariantId(view, variantId) : null;

  const setQuantity = useCallback(
    (quantity: number) => {
      if (!view || !line) return;

      const currentView = view;
      const currentLine = line;

      startTransition(async () => {
        try {
          const next =
            quantity <= 0
              ? await removeCartLine(currentLine, currentView.mode)
              : await setCartLineQuantity(
                  currentLine,
                  quantity,
                  currentView.mode,
                );
          setView(next);
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
    refresh,
  };
}
