"use client";

import type { ProductDetailVariant } from "@ishraqparfums/shared";
import { isVariantSellable } from "@/lib/catalog/product-variants";
import { cn } from "@/lib/cn";

/**
 * Size selection for the v2 PDP.
 *
 * Deliberately not `shop/filter-chip.tsx`: that component is shared with the
 * shop's collection filters (`shop-collection-filters.tsx`), so restyling it
 * would silently repaint `/shop`, and its gold-fill active state belongs to
 * the v1 palette anyway. This is the same interaction in v2's language —
 * square-ish outline, terra on the selected size, no gold.
 *
 * Sold-out sizes stay visible and selectable-looking but are struck through
 * and dimmed, matching v1 behaviour: seeing that a size exists but is gone
 * is useful information, and hiding it would make the range look smaller
 * than it is.
 */
export function ProductSizeSelect({
  variants,
  selectedId,
  onSelect,
  heading = true,
}: {
  variants: ProductDetailVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Set false in the closing buy row, where the product name already leads. */
  heading?: boolean;
}) {
  if (variants.length === 0) return null;

  return (
    <div>
      {heading ? (
        <p className="text-[13px] text-graphite-soft">Size</p>
      ) : null}
      <div
        className={heading ? "mt-3 flex flex-wrap gap-2" : "flex flex-wrap gap-2"}
        role="radiogroup"
        aria-label="Bottle size"
      >
        {variants.map((variant) => {
          const sellable = isVariantSellable(variant);
          const active = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={!sellable}
              onClick={() => onSelect(variant.id)}
              className={cn(
                "cursor-pointer border px-4 py-2 text-[15px] transition-colors duration-200",
                active
                  ? "border-terra bg-terra/[0.06] text-terra"
                  : "border-graphite/30 text-graphite hover:border-graphite/60",
                !sellable && "line-through opacity-45",
              )}
            >
              {variant.sizeMl} ml
            </button>
          );
        })}
      </div>
    </div>
  );
}
