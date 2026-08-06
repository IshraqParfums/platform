"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CartEmpty } from "@/components/cart/cart-empty";
import { CartLine } from "@/components/cart/cart-line";
import { CartSummary } from "@/components/cart/cart-summary";
import { toast } from "@/components/ui/toaster";
import { isShopAuthenticated } from "@/lib/auth/shop-session";
import {
  emptyCartView,
  loadCart,
  removeCartLine,
  setCartLineQuantity,
} from "@/lib/cart/cart-client";
import {
  cartEditorialLine,
  cartItemCountLabel,
} from "@/lib/cart/cart-copy";
import { subscribeCartChanged } from "@/lib/cart/cart-events";
import type { CartView } from "@/lib/cart/cart-view";

/**
 * Client cart orchestrator — loads guest or server cart and handles mutations.
 * Title + lines share the left column; Summary sticks to the top on desktop.
 */
export function CartPageClient() {
  const [view, setView] = useState<CartView | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const [auth, next] = await Promise.all([
          isShopAuthenticated(),
          loadCart(),
        ]);
        setAuthenticated(auth || next.mode === "server");
        setView(next);
        setError(null);
      } catch {
        setView(emptyCartView());
        setError("Could not load your cart.");
      }
    });
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCartChanged(() => {
      void loadCart()
        .then((next) => {
          setView(next);
          if (next.mode === "server") setAuthenticated(true);
        })
        .catch(() => setView(emptyCartView()));
    });
  }, [refresh]);

  function runMutation(
    key: string,
    work: () => Promise<CartView>,
  ) {
    setPendingKey(key);
    setError(null);
    startTransition(async () => {
      try {
        const next = await work();
        setView(next);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Update failed";
        setError(message);
        toast.error("Could not update cart", message);
        refresh();
      } finally {
        setPendingKey(null);
      }
    });
  }

  if (view === null) {
    return (
      <div className="py-16">
        <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Loading cart…
        </p>
      </div>
    );
  }

  if (view.lines.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,21rem)] lg:items-start lg:gap-14 xl:gap-20">
      <div className="min-w-0">
        <header className="max-w-xl">
          <h1 className="font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
            Your cart
          </h1>
          <p className="mt-3 font-display text-[1.05rem] leading-snug text-ink-soft sm:text-[1.125rem]">
            {cartEditorialLine(view.lines.length)}
          </p>
          <p className="mt-3 font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            {cartItemCountLabel(view.itemCount)}
            {view.mode === "guest" ? " · Saved on this device" : null}
          </p>
        </header>

        {error ? (
          <p className="mt-6 text-sm text-rose-deep" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-10 divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
          {view.lines.map((line) => (
            <CartLine
              key={line.key}
              line={line}
              pending={isPending && pendingKey === line.key}
              onQuantityChange={(quantity) => {
                runMutation(line.key, () =>
                  setCartLineQuantity(line, quantity, view.mode),
                );
              }}
              onRemove={() => {
                runMutation(line.key, () => removeCartLine(line, view.mode));
              }}
            />
          ))}
        </div>
      </div>

      <CartSummary view={view} authenticated={authenticated} />
    </div>
  );
}
