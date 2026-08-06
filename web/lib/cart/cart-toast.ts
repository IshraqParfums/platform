"use client";

import { toast } from "@/components/ui/toaster";
import { CART_PATH } from "@/lib/cart/cart-path";

/**
 * Success toast after add-to-cart, with a View cart action.
 * Keeps product CTAs free of toast wiring details.
 */
export function toastAddedToCart(productName: string) {
  return toast.success(productName, {
    description: "Added to your cart",
    duration: 4500,
    action: {
      label: "View cart",
      onClick: () => {
        window.location.assign(CART_PATH);
      },
    },
  });
}
