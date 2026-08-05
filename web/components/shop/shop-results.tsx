"use client";

import type { ReactNode } from "react";
import { useShopNavigate } from "@/components/shop/shop-navigation";
import { cn } from "@/lib/cn";

/** Dims the product grid while a soft shop navigation is in flight. */
export function ShopResults({ children }: { children: ReactNode }) {
  const { isPending } = useShopNavigate();

  return (
    <div
      aria-busy={isPending}
      className={cn(
        "transition-opacity duration-200",
        isPending && "pointer-events-none opacity-60",
      )}
    >
      {children}
    </div>
  );
}
