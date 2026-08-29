"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { CartEmpty } from "@/components/cart/cart-empty";
import { CartLine } from "@/components/cart/cart-line";
import { CartSkeleton } from "@/components/cart/cart-skeleton";
import { CartSummary } from "@/components/cart/cart-summary";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ensureShopSession } from "@/lib/auth/shop-session";
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
import { emitCartChanged, subscribeCartChanged } from "@/lib/cart/cart-events";
import { toastRemovedFromCart } from "@/lib/cart/cart-toast";
import {
  cancelPendingCartCommit,
  registerPendingCartCommit,
  runPendingCartCommit,
} from "@/lib/cart/pending-cart-commits";
import {
  cartUnavailableLines,
  withLineQuantity,
  withLineRestored,
  type CartView,
  type CartViewLine,
} from "@/lib/cart/cart-view";

/**
 * Client cart orchestrator — loads guest or server cart and handles mutations.
 * On load: auto-removes DISCONTINUED lines, toasts unavailable lines.
 *
 * URDU: "آپ کی ٹوکری" ("your basket") is new and unreviewed — check with a
 * native reader before shipping, same as the other Urdu lines added across
 * this pass.
 */
export function CartPageClient() {
  const [view, setView] = useState<CartView | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const viewRef = useRef<CartView | null>(null);
  const reconciledLoadRef = useRef(false);

  viewRef.current = view;

  /** Set cart UI and notify listeners — never call emit from inside a setState updater. */
  const publishView = useCallback((next: CartView) => {
    viewRef.current = next;
    setView(next);
    emitCartChanged({ itemCount: next.itemCount, view: next });
  }, []);

  const reconcileLoadedCart = useCallback(
    async (next: CartView): Promise<CartView> => {
      const discontinued = next.lines.filter(
        (line) => line.unavailableReason === "DISCONTINUED",
      );

      let working = next;
      if (discontinued.length > 0) {
        for (const line of discontinued) {
          working = await removeCartLine(line, working.mode);
        }
        const label =
          discontinued.length === 1
            ? "1 item is no longer available and was removed."
            : `${discontinued.length} items are no longer available and were removed.`;
        toast.message(label);
      }

      const unavailable = cartUnavailableLines(working);
      if (unavailable.length > 0) {
        const label =
          unavailable.length === 1
            ? "1 item in your cart isn't available right now."
            : `${unavailable.length} items in your cart aren't available right now.`;
        toast.message(label);
      }

      return working;
    },
    [],
  );

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const [auth, loaded] = await Promise.all([
          ensureShopSession(),
          loadCart(),
        ]);
        const next = reconciledLoadRef.current
          ? loaded
          : await reconcileLoadedCart(loaded);
        reconciledLoadRef.current = true;
        setAuthenticated(auth || next.mode === "server");
        viewRef.current = next;
        setView(next);
        setError(null);
      } catch {
        const empty = emptyCartView();
        viewRef.current = empty;
        setView(empty);
        setError("Could not load your cart.");
      }
    });
  }, [reconcileLoadedCart]);

  useEffect(() => {
    refresh();
    return subscribeCartChanged((detail) => {
      if (detail.view) {
        viewRef.current = detail.view;
        setView(detail.view);
        if (detail.view.mode === "server") setAuthenticated(true);
        return;
      }
      void loadCart()
        .then((next) => {
          viewRef.current = next;
          setView(next);
          if (next.mode === "server") setAuthenticated(true);
        })
        .catch(() => {
          const empty = emptyCartView();
          viewRef.current = empty;
          setView(empty);
        });
    });
  }, [refresh]);

  /** Silent refresh when returning to this tab — catches admin availability changes. */
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (!reconciledLoadRef.current) return;
      void loadCart()
        .then((next) => {
          viewRef.current = next;
          setView(next);
          emitCartChanged({ itemCount: next.itemCount, view: next });
        })
        .catch(() => {
          /* keep current view */
        });
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function runMutation(
    key: string,
    optimisticView: CartView,
    work: () => Promise<CartView>,
  ) {
    setPendingKey(key);
    setError(null);
    publishView(optimisticView);

    startTransition(async () => {
      try {
        const next = await work();
        viewRef.current = next;
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

  function restoreRemovedLine(line: CartViewLine, fallback: CartView) {
    const base = viewRef.current ?? fallback;
    publishView(withLineRestored(base, line));
  }

  function removeLine(line: CartViewLine, current: CartView) {
    const optimistic = withLineQuantity(current, line.key, 0);
    const commitId = line.key;
    setError(null);
    publishView(optimistic);

    const toastId = toastRemovedFromCart({
      productName: line.productName,
      onUndo: () => {
        cancelPendingCartCommit(commitId);
        restoreRemovedLine(line, optimistic);
      },
      onCommit: () => {
        void runPendingCartCommit(commitId).catch((err) => {
          const message =
            err instanceof Error ? err.message : "Update failed";
          setError(message);
          toast.error("Could not update cart", message);
          restoreRemovedLine(line, optimistic);
        });
      },
    });

    registerPendingCartCommit(
      commitId,
      async () => {
        const next = await removeCartLine(line, current.mode);
        viewRef.current = next;
        setView(next);
      },
      toastId,
    );
  }

  function removeUnavailable(current: CartView) {
    const unavailable = cartUnavailableLines(current);
    if (unavailable.length === 0) return;

    let optimistic = current;
    for (const line of unavailable) {
      optimistic = withLineQuantity(optimistic, line.key, 0);
    }
    publishView(optimistic);

    startTransition(async () => {
      try {
        let working = current;
        for (const line of unavailable) {
          working = await removeCartLine(line, working.mode);
        }
        viewRef.current = working;
        setView(working);
        toast.success(
          unavailable.length === 1
            ? "Unavailable item removed"
            : "Unavailable items removed",
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Update failed";
        setError(message);
        toast.error("Could not update cart", message);
        refresh();
      }
    });
  }

  if (view === null) {
    return <CartSkeleton />;
  }

  if (view.lines.length === 0) {
    return <CartEmpty authenticated={authenticated} />;
  }

  const unavailableCount = cartUnavailableLines(view).length;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,21rem)] lg:items-start lg:gap-14 xl:gap-20">
      <div className="min-w-0">
        <header className="max-w-xl">
          <Urdu size="sm" tone="brass" align="start">
            {"آپ کی ٹوکری"}
          </Urdu>
          <h1 className="mt-3 font-editorial text-[clamp(30px,4.2vw,42px)] leading-[1.04] text-graphite">
            Your cart.
          </h1>
          <p className="mt-3 font-editorial text-[17px] italic leading-snug text-graphite-soft">
            {cartEditorialLine(view.lines.length)}
          </p>
          <p className="mt-3 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
            {cartItemCountLabel(view.itemCount)}
            {view.mode === "guest" ? " · Saved on this device" : null}
          </p>
        </header>

        {error ? (
          <p className="mt-6 text-sm text-terra" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-10 divide-y divide-graphite/[0.08] border-y border-graphite/[0.08]">
          {view.lines.map((line) => (
            <CartLine
              key={line.key}
              line={line}
              pending={isPending && pendingKey === line.key}
              onQuantityChange={(quantity) => {
                runMutation(
                  line.key,
                  withLineQuantity(view, line.key, quantity),
                  () => setCartLineQuantity(line, quantity, view.mode),
                );
              }}
              onRemove={() => removeLine(line, view)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {unavailableCount > 0 ? (
          <Button
            type="button"
            variant="outline-paper"
            size="md"
            className="w-full cursor-pointer"
            onClick={() => removeUnavailable(view)}
            disabled={isPending}
          >
            Remove unavailable items
          </Button>
        ) : null}
        <CartSummary view={view} authenticated={authenticated} />
      </div>
    </div>
  );
}
