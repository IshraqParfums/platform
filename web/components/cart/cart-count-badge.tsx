import { cn } from "@/lib/cn";

/**
 * Corner count pill for a selectable option that is already in the cart.
 *
 * Renders nothing at zero so callers can mount it unconditionally. Positioned
 * absolutely, so the host element needs `relative`.
 */
export function CartCountBadge({
  quantity,
  label,
  className,
}: {
  quantity: number;
  /** Describes what the count belongs to, e.g. "50 ml". */
  label?: string;
  className?: string;
}) {
  if (quantity <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1",
        "font-ui text-[10px] font-semibold leading-none",
        "bg-terra text-paper",
        className,
      )}
      aria-label={
        label ? `${quantity} ${label} in cart` : `${quantity} in cart`
      }
    >
      {quantity > 9 ? "9+" : quantity}
    </span>
  );
}
