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

/**
 * Soft-remove toast: Undo cancels the pending delete; dismiss/timeout commits it.
 * Callers should update UI optimistically and register the commit with
 * `pending-cart-commits` before invoking this.
 */
export function toastRemovedFromCart({
  productName,
  onUndo,
  onCommit,
}: {
  productName: string;
  onUndo: () => void;
  onCommit: () => void;
}): string | number {
  let settled = false;

  const finish = (fn: () => void) => {
    if (settled) return;
    settled = true;
    fn();
  };

  return toast.message(productName, {
    description: "Removed from your cart",
    duration: 5000,
    action: {
      label: "Undo",
      onClick: () => finish(onUndo),
    },
    onDismiss: () => finish(onCommit),
  });
}
