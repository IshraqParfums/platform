"use client";

import type { AdminProductVariant } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VariantFormModal } from "@/components/admin/variant-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  discountPercentFromPrices,
  formatDiscountOff,
} from "@/lib/admin/variant-pricing";
import { formatPaise } from "@/lib/format/money";

export function ProductVariantsPanel({
  productId,
  variants,
}: {
  productId: string;
  variants: AdminProductVariant[];
}) {
  const router = useRouter();
  const [editingVariant, setEditingVariant] = useState<AdminProductVariant | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Variants</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => setCreating(true)}
        >
          Add variant
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-faint">
              <th className="py-2 pr-4 font-mono text-label-sm uppercase">Size</th>
              <th className="py-2 pr-4 font-mono text-label-sm uppercase">Price</th>
              <th className="py-2 pr-4 font-mono text-label-sm uppercase">
                Discount
              </th>
              <th className="py-2 pr-4 font-mono text-label-sm uppercase">Stock</th>
              <th className="py-2 pr-4 font-mono text-label-sm uppercase">Reserved</th>
              <th className="py-2 pr-4 font-mono text-label-sm uppercase">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {variants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-ink-faint">
                  No variants yet.
                </td>
              </tr>
            ) : (
              variants.map((variant) => {
                const priceRupees = Math.round(variant.pricePaise / 100);
                const compareRupees =
                  variant.compareAtPricePaise != null
                    ? Math.round(variant.compareAtPricePaise / 100)
                    : null;
                const discount =
                  compareRupees != null
                    ? discountPercentFromPrices(priceRupees, compareRupees)
                    : null;

                return (
                  <tr
                    key={variant.id}
                    className="border-b border-ink/[0.06] last:border-0"
                  >
                    <td className="py-2 pr-3 text-ink">{variant.sizeMl} ml</td>
                    <td className="py-2 pr-3 text-ink">
                      {formatPaise(variant.pricePaise)}
                      {variant.compareAtPricePaise ? (
                        <span className="ml-1.5 text-xs text-ink-faint line-through">
                          {formatPaise(variant.compareAtPricePaise)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-ink-soft">
                      {formatDiscountOff(discount)}
                    </td>
                    <td className="py-2 pr-3 font-medium text-ink">
                      {variant.stockQty}
                    </td>
                    <td className="py-2 pr-3 text-ink-soft">
                      {variant.reservedQty}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={variant.isAvailable ? "sage" : "neutral"}>
                        {variant.isAvailable ? "Available" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setEditingVariant(variant)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingVariant ? (
        <VariantFormModal
          productId={productId}
          variant={editingVariant}
          open={Boolean(editingVariant)}
          onClose={() => setEditingVariant(null)}
          onSaved={refresh}
        />
      ) : null}

      <VariantFormModal
        productId={productId}
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={refresh}
      />
    </div>
  );
}
