"use client";

import type { ReactNode } from "react";
import { useShopNavigate } from "@/components/shop/shop-navigation";

/**
 * While a soft shop navigation is in flight, swap the product listing for
 * shimmer card skeletons instead of dimming live content.
 */
export function ShopResults({
  children,
  skeleton,
}: {
  children: ReactNode;
  skeleton: ReactNode;
}) {
  const { isPending } = useShopNavigate();

  return (
    <div aria-busy={isPending}>
      {isPending ? skeleton : children}
    </div>
  );
}
