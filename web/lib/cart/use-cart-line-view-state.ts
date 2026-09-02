"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { emptyCartView, loadCart } from "@/lib/cart/cart-client";
import { subscribeCartChanged } from "@/lib/cart/cart-events";
import type { CartView } from "@/lib/cart/cart-view";

/**
 * Shared load/refresh/subscribe machinery behind every per-line cart hook.
 * Extracted from `useCartVariantLine`/`useCartBespokeLine`, which had
 * byte-identical copies of this block.
 */
export function useCartLineViewState() {
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

  return { view, setView, ready, isPending, startTransition, viewRef, refresh };
}
