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
  restoreCartLine,
  setCartLineQuantity,
} from "@/lib/cart/cart-client";
import {
  cartEditorialLine,
  cartItemCountLabel,
} from "@/lib/cart/cart-copy";
import { emitCartChanged, subscribeCartChanged } from "@/lib/cart/cart-events";
import { toastRemovedFromCart } from "@/lib/cart/cart-toast";
import { createLineMutationQueue } from "@/lib/cart/line-mutation-queue";
import { addWishlistItem } from "@/lib/wishlist/wishlist-client";
import {
  cartUnavailableLines,
  findCartLineByKey,
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
  const queueRef = useRef(createLineMutationQueue());
  const itemIdByKeyRef = useRef(new Map<string, string>());

  viewRef.current = view;

  const rememberItemIds = useCallback((next: CartView) => {
    for (const line of next.lines) {
      if (line.itemId) itemIdByKeyRef.current.set(line.key, line.itemId);
    }
  }, []);

  /** Set cart UI and notify listeners — never call emit from inside a setState updater. */
  const publishView = useCallback(
    (next: CartView) => {
      rememberItemIds(next);
      viewRef.current = next;
      setView(next);
      emitCartChanged({ itemCount: next.itemCount, view: next });
    },
    [rememberItemIds],
  );

  function resolveQueuedLine(snapshot: CartViewLine): CartViewLine {
    const live = viewRef.current
      ? findCartLineByKey(viewRef.current, snapshot.key)
      : null;
    const itemId =
      live?.itemId ??
      itemIdByKeyRef.current.get(snapshot.key) ??
      snapshot.itemId;
    return { ...(live ?? snapshot), itemId };
  }

  function mutationBase(mode: CartView["mode"]): CartView {
    return viewRef.current ?? emptyCartView(mode);
  }

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
        rememberItemIds(next);
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
  }, [reconcileLoadedCart, rememberItemIds]);

  useEffect(() => {
    refresh();
    return subscribeCartChanged((detail) => {
      if (detail.view) {
        rememberItemIds(detail.view);
        viewRef.current = detail.view;
        setView(detail.view);
        if (detail.view.mode === "server") setAuthenticated(true);
        return;
      }
      void loadCart()
        .then((next) => {
          rememberItemIds(next);
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
  }, [refresh, rememberItemIds]);

  /** Silent refresh when returning to this tab — catches admin availability changes. */
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (!reconciledLoadRef.current) return;
      void loadCart()
        .then((next) => {
          rememberItemIds(next);
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

  function failCartWrite(err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    setError(message);
    toast.error("Could not update cart", message);
    refresh();
  }

  function enqueueLineWork(key: string, work: () => Promise<void>) {
    setPendingKey(key);
    setError(null);
    void queueRef.current.enqueue(key, work).finally(() => {
      setPendingKey((current) => (current === key ? null : current));
    });
  }

  function changeQuantity(line: CartViewLine, quantity: number) {
    const current = viewRef.current;
    if (!current) return;
    publishView(withLineQuantity(current, line.key, quantity));

    enqueueLineWork(line.key, async () => {
      try {
        const mode = viewRef.current?.mode ?? current.mode;
        const live = resolveQueuedLine(line);
        const next = await setCartLineQuantity(live, quantity, mode, {
          emit: false,
          base: mutationBase(mode),
        });
        publishView(next);
      } catch (err) {
        failCartWrite(err);
      }
    });
  }

  function removeLine(line: CartViewLine, current: CartView) {
    if (line.itemId) itemIdByKeyRef.current.set(line.key, line.itemId);

    const optimistic = withLineQuantity(current, line.key, 0);
    publishView(optimistic);

    toastRemovedFromCart({
      productName: line.productName,
      onUndo: () => {
        const fallback = viewRef.current ?? optimistic;
        publishView(withLineRestored(fallback, line));
        enqueueLineWork(line.key, async () => {
          try {
            const mode = viewRef.current?.mode ?? current.mode;
            const next = await restoreCartLine(line, mode, {
              emit: false,
              base: mutationBase(mode),
            });
            publishView(next);
          } catch (err) {
            failCartWrite(err);
          }
        });
      },
    });

    enqueueLineWork(line.key, async () => {
      try {
        const mode = viewRef.current?.mode ?? current.mode;
        const live = resolveQueuedLine(line);
        const next = await removeCartLine(live, mode, {
          emit: false,
          base: mutationBase(mode),
        });
        publishView(next);
      } catch (err) {
        failCartWrite(err);
      }
    });
  }

  /**
   * Adds to the wishlist before removing from the cart — a failed second
   * call duplicates the item rather than losing it, same failure direction
   * checkout already prefers when pruning unsellable lines.
   */
  async function moveToWishlist(line: CartViewLine, current: CartView) {
    if (line.kind !== "catalog") return;

    try {
      await addWishlistItem({
        slug: line.productSlug,
        name: line.productName,
        nameUrdu: null,
        shortDescription: line.shortDescription ?? "",
        openingNotes: [],
        collectionSlug: "",
        primaryImage: line.primaryImageUrl
          ? { url: line.primaryImageUrl, altText: null }
          : null,
        images: line.primaryImageUrl
          ? [{ url: line.primaryImageUrl, altText: null }]
          : [],
        fromSizeMl: line.sizeMl,
        fromPricePaise: line.pricePaise,
        fromCompareAtPricePaise: line.compareAtPricePaise,
        availability: line.isAvailable ? "AVAILABLE" : "OUT_OF_STOCK",
        ratingAverage: null,
        reviewCount: 0,
      });
    } catch (err) {
      toast.error(
        "Could not save to wishlist",
        err instanceof Error ? err.message : undefined,
      );
      return;
    }

    toast.success(`${line.productName} moved to wishlist`);
    removeLine(line, current);
  }

  function removeUnavailable(current: CartView) {
    const unavailable = cartUnavailableLines(current);
    if (unavailable.length === 0) return;

    let optimistic = current;
    for (const line of unavailable) {
      if (line.itemId) itemIdByKeyRef.current.set(line.key, line.itemId);
      optimistic = withLineQuantity(optimistic, line.key, 0);
    }
    publishView(optimistic);

    startTransition(async () => {
      try {
        for (const line of unavailable) {
          await queueRef.current.enqueue(line.key, async () => {
            const mode = viewRef.current?.mode ?? current.mode;
            const live = resolveQueuedLine(line);
            const next = await removeCartLine(live, mode, {
              emit: false,
              base: mutationBase(mode),
            });
            publishView(next);
          });
        }
        toast.success(
          unavailable.length === 1
            ? "Unavailable item removed"
            : "Unavailable items removed",
        );
      } catch (err) {
        failCartWrite(err);
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
              pending={pendingKey === line.key}
              onQuantityChange={(quantity) => {
                changeQuantity(line, quantity);
              }}
              onRemove={() => removeLine(line, view)}
              onMoveToWishlist={() => void moveToWishlist(line, view)}
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
