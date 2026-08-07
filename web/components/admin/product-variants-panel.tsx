"use client";

import type { AdminProductVariant, ProductStatus } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VariantFormModal } from "@/components/admin/variant-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import {
  discountPercentFromPrices,
  formatDiscountOff,
} from "@/lib/admin/variant-pricing";
import { formatPaise } from "@/lib/format/money";

export function ProductVariantsPanel({
  productId,
  status,
  variants: variantsProp,
}: {
  productId: string;
  status: ProductStatus;
  variants: AdminProductVariant[];
}) {
  const router = useRouter();
  const [variants, setVariants] = useState(variantsProp);
  const [editingVariant, setEditingVariant] = useState<AdminProductVariant | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [makeUnavailableOpen, setMakeUnavailableOpen] = useState(false);
  const [makingUnavailable, setMakingUnavailable] = useState(false);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    setVariants(variantsProp);
  }, [variantsProp]);

  const hasAvailableVariants = variants.some((v) => v.isAvailable);
  const showMakeUnavailable = status === "ACTIVE" && hasAvailableVariants;

  useEffect(() => {
    if (!makeUnavailableOpen) {
      setCartCount(null);
      return;
    }

    let cancelled = false;
    setCartLoading(true);
    setCartCount(null);

    void (async () => {
      try {
        const response = await adminFetch(
          `/api/admin/products/${productId}/cart-impact`,
        );
        if (!response.ok) throw new Error("Could not load cart impact");
        const data = (await response.json()) as { cartCount: number };
        if (!cancelled) setCartCount(data.cartCount);
      } catch {
        if (!cancelled) setCartCount(null);
      } finally {
        if (!cancelled) setCartLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [makeUnavailableOpen, productId]);

  function onSaved(variant: AdminProductVariant) {
    setVariants((prev) => {
      const index = prev.findIndex((item) => item.id === variant.id);
      if (index === -1) return [...prev, variant];
      const next = [...prev];
      next[index] = variant;
      return next;
    });
    router.refresh();
  }

  async function confirmMakeUnavailable() {
    setMakingUnavailable(true);
    try {
      const response = await adminFetch(
        `/api/admin/products/${productId}/variants/unavailable`,
        { method: "PATCH" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not update variants");
      }
      setVariants((prev) =>
        prev.map((variant) => ({ ...variant, isAvailable: false })),
      );
      setMakeUnavailableOpen(false);
      toast.success("All sizes set to unavailable");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setMakingUnavailable(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Variants</h2>
        <div className="flex flex-wrap gap-2">
          {showMakeUnavailable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setMakeUnavailableOpen(true)}
            >
              Make all sizes unavailable
            </Button>
          ) : null}
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
      </div>

      {showMakeUnavailable ? (
        <p className="mt-2 text-xs text-ink-faint">
          Making all sizes unavailable hides this product from the shop without
          deleting it.
        </p>
      ) : null}

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
          onSaved={onSaved}
        />
      ) : null}

      <VariantFormModal
        productId={productId}
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={onSaved}
      />

      <Modal
        open={makeUnavailableOpen}
        title="Make all sizes unavailable"
        onClose={() => {
          if (!makingUnavailable) setMakeUnavailableOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={makingUnavailable}
              onClick={() => setMakeUnavailableOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={makingUnavailable}
              onClick={() => void confirmMakeUnavailable()}
              className="cursor-pointer"
            >
              {makingUnavailable ? "Updating…" : "Make unavailable"}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Every size will be hidden from the shop. Customers will no longer be
          able to add this product to cart. The product stays Active.
        </p>
        {cartLoading ? (
          <p className="mt-3 text-sm text-ink-faint">Checking customer carts…</p>
        ) : cartCount != null ? (
          <p className="mt-3 text-sm text-ink-soft">
            In <span className="font-medium text-ink">{cartCount}</span> customer{" "}
            {cartCount === 1 ? "cart" : "carts"} right now.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
