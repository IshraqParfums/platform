"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductListItem } from "@ishraqparfums/shared";
import { ShopJournalRow } from "@/components/shop/shop-journal-row";
import { Skeleton, SkeletonScreen, SkeletonStack } from "@/components/ui/skeleton";
import { ButtonLink, Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { addToCart } from "@/lib/cart/add-to-cart";
import { getProductDetailClient } from "@/lib/catalog/product-detail-client";
import { pickDefaultVariant, isVariantSellable } from "@/lib/catalog/product-variants";
import {
  loadWishlist,
  removeWishlistItem,
  type WishlistView as WishlistViewData,
} from "@/lib/wishlist/wishlist-client";
import { subscribeWishlistChanged } from "@/lib/wishlist/wishlist-events";

function WishlistSkeleton() {
  return (
    <SkeletonScreen label="Loading your wishlist">
      <header className="max-w-xl">
        <SkeletonStack gap="md">
          <Skeleton className="h-10 w-48 sm:h-11 sm:w-56" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </SkeletonStack>
      </header>
      <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-6">
            <Skeleton className="aspect-[4/5] w-full" />
            <SkeletonStack gap="sm">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </SkeletonStack>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}

function WishlistEmpty() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center sm:py-14 md:py-16">
      <h1 className="font-editorial text-[clamp(32px,4.6vw,44px)] leading-[1.04] text-graphite">
        Nothing saved yet.
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-graphite-soft">
        Heart a scent while you browse and it will wait here for you.
      </p>
      <ButtonLink
        href="/shop"
        variant="ink"
        size="pill"
        className="mt-9 cursor-pointer"
      >
        Browse perfumes
      </ButtonLink>
    </div>
  );
}

export function WishlistView() {
  const [view, setView] = useState<WishlistViewData | null>(null);
  const [movingSlug, setMovingSlug] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void loadWishlist().then(setView);
  }, []);

  useEffect(() => {
    refresh();
    // Filter locally rather than refetching — `loadWishlist()` itself emits
    // this same event, so reacting to it with another `refresh()` would loop
    // forever. The event's `slugs` is enough to drop a just-removed item from
    // the grid; a product added elsewhere while this page sits open only
    // appears on the next visit, not reactively — an accepted trade-off.
    return subscribeWishlistChanged(({ slugs }) => {
      setView((current) => {
        if (!current) return current;
        const items = current.items.filter((item) => slugs.has(item.slug));
        return { ...current, items, itemCount: items.length };
      });
    });
  }, [refresh]);

  async function moveToCart(item: ProductListItem) {
    setMovingSlug(item.slug);
    try {
      const detail = await getProductDetailClient(item.slug);
      const variant = detail ? pickDefaultVariant(detail.variants) : null;
      if (!detail || !variant || !isVariantSellable(variant)) {
        throw new Error("This size is no longer available");
      }

      await addToCart({
        variantId: variant.id,
        productName: detail.name,
        productSlug: detail.slug,
        collectionName: detail.collection.name,
        shortDescription: detail.shortDescription,
        sizeMl: variant.sizeMl,
        pricePaise: variant.pricePaise,
        compareAtPricePaise: variant.compareAtPricePaise,
        primaryImageUrl: item.primaryImage?.url ?? null,
        stockQty: variant.stockQty,
      });
      await removeWishlistItem(item.slug);
      toast.success(`${detail.name} moved to cart`);
    } catch (err) {
      toast.error(
        "Could not move to cart",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setMovingSlug(null);
    }
  }

  if (view === null) {
    return <WishlistSkeleton />;
  }

  if (view.items.length === 0) {
    return <WishlistEmpty />;
  }

  return (
    <div>
      <header className="max-w-xl">
        <h1 className="font-editorial text-[clamp(30px,4.2vw,42px)] leading-[1.04] text-graphite">
          Your wishlist.
        </h1>
        <p className="mt-3 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
          {view.itemCount} saved
          {view.mode === "guest" ? " · Saved on this device" : null}
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
        {view.items.map((item) => {
          const moving = movingSlug === item.slug;
          return (
            <div key={item.slug} className="flex flex-col gap-4">
              <ShopJournalRow product={item} />
              {item.availability === "AVAILABLE" ? (
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    type="button"
                    variant="outline-paper"
                    size="sm"
                    className="cursor-pointer"
                    disabled={moving}
                    onClick={() => moveToCart(item)}
                  >
                    {moving ? "Moving…" : "Move to cart"}
                  </Button>
                  <ButtonLink
                    href={`/products/${item.slug}`}
                    variant="ghost"
                    size="sm"
                  >
                    Choose a different size
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
