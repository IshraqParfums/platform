"use client";

import { cn } from "@/lib/cn";

/**
 * Full-viewport hit target that sits under a sheet/menu (z-50) and above
 * the page (z-40). A tap anywhere on it dismisses — the same pattern as
 * the admin mobile sidebar, shared so storefront chrome can reuse it.
 *
 * Colour/visibility is the caller's job (`className`) because paper and
 * espresso surfaces need different washes.
 */
export function DismissScrim({
  onDismiss,
  label = "Close menu",
  className,
}: {
  onDismiss: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={-1}
      className={cn("fixed inset-0 z-40", className)}
      onPointerDown={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={onDismiss}
    />
  );
}
