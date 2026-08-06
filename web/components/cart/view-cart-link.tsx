"use client";

import { ButtonLink } from "@/components/ui/button";
import { CART_PATH } from "@/lib/cart/cart-path";
import { cn } from "@/lib/cn";

/**
 * Shared “go to cart” control — use beside steppers, empty states, etc.
 */
export function ViewCartLink({
  className,
  size = "sm",
  variant = "outline",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "emphasis" | "ghost";
}) {
  return (
    <ButtonLink
      href={CART_PATH}
      variant={variant}
      size={size}
      className={cn("cursor-pointer", className)}
    >
      View cart
    </ButtonLink>
  );
}
