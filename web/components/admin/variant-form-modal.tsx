"use client";

import type { AdminProductVariant } from "@ishraqparfums/shared";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import {
  clampDiscountPercent,
  compareAtFromDiscountPercent,
  discountPercentFromPrices,
  isValidDiscountPercent,
  MAX_DISCOUNT_PERCENT,
  parseWholePercent,
  parseWholeRupees,
  suggestedCompareAt,
} from "@/lib/admin/variant-pricing";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function toPaise(rupees: number): number {
  return rupees * 100;
}

function toRupees(paise: number): string {
  return String(Math.round(paise / 100));
}

export function VariantFormModal({
  productId,
  variant,
  open,
  onClose,
  onSaved,
}: {
  productId: string;
  variant?: AdminProductVariant;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(variant);
  const initialPrice = variant ? Math.round(variant.pricePaise / 100) : null;
  const initialCompare =
    variant?.compareAtPricePaise != null
      ? Math.round(variant.compareAtPricePaise / 100)
      : null;
  const initialDiscount =
    initialPrice != null && initialCompare != null
      ? discountPercentFromPrices(initialPrice, initialCompare)
      : null;

  const [sizeMl, setSizeMl] = useState(variant ? String(variant.sizeMl) : "");
  const [price, setPrice] = useState(variant ? toRupees(variant.pricePaise) : "");
  const [compareAt, setCompareAt] = useState(
    initialCompare != null ? String(initialCompare) : "",
  );
  const [discountPercent, setDiscountPercent] = useState(
    initialDiscount != null && initialDiscount > 0 ? String(initialDiscount) : "",
  );
  const [compareTouched, setCompareTouched] = useState(initialCompare != null);
  const [stockQty, setStockQty] = useState(variant ? String(variant.stockQty) : "0");
  const [isAvailable, setIsAvailable] = useState(variant?.isAvailable ?? true);
  const [submitting, setSubmitting] = useState(false);

  function setDiscountFromDerived(pct: number | null) {
    if (pct == null) {
      setDiscountPercent("");
      return;
    }
    if (!isValidDiscountPercent(pct)) {
      setDiscountPercent(String(clampDiscountPercent(pct)));
      return;
    }
    setDiscountPercent(pct > 0 ? String(pct) : pct === 0 ? "0" : "");
  }

  function syncFromPrice(nextPrice: string) {
    setPrice(nextPrice);
    const parsed = parseWholeRupees(nextPrice);
    if (parsed == null) return;

    if (!isEdit && !compareTouched) {
      const suggested = suggestedCompareAt(parsed);
      setCompareAt(String(suggested));
      setDiscountFromDerived(discountPercentFromPrices(parsed, suggested));
      return;
    }

    const compareParsed = parseWholeRupees(compareAt);
    if (compareParsed != null) {
      setDiscountFromDerived(discountPercentFromPrices(parsed, compareParsed));
    }
  }

  function syncFromCompareAt(nextCompare: string) {
    setCompareTouched(true);
    setCompareAt(nextCompare);
    const priceParsed = parseWholeRupees(price);
    const compareParsed = parseWholeRupees(nextCompare);
    if (priceParsed == null || compareParsed == null) {
      setDiscountPercent("");
      return;
    }
    setDiscountFromDerived(discountPercentFromPrices(priceParsed, compareParsed));
  }

  function syncFromDiscount(nextDiscount: string) {
    setCompareTouched(true);
    const trimmed = nextDiscount.trim();
    if (trimmed === "") {
      setDiscountPercent("");
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setDiscountPercent(nextDiscount);
      return;
    }

    const raw = Number(trimmed);
    const pct = clampDiscountPercent(raw);
    if (raw > MAX_DISCOUNT_PERCENT) {
      toast.error(`Discount can’t be more than ${MAX_DISCOUNT_PERCENT}%`);
    }
    setDiscountPercent(String(pct));

    const priceParsed = parseWholeRupees(price);
    if (priceParsed == null) return;
    const nextCompare = compareAtFromDiscountPercent(priceParsed, pct);
    if (nextCompare != null) setCompareAt(String(nextCompare));
  }

  async function submit() {
    const priceRupees = parseWholeRupees(price);
    if (priceRupees == null) {
      toast.error("Price must be a whole number of rupees");
      return;
    }

    if (discountPercent.trim()) {
      const pct = parseWholePercent(discountPercent);
      if (pct == null) {
        toast.error(`Discount must be a whole number from 0 to ${MAX_DISCOUNT_PERCENT}`);
        return;
      }
    }

    let compareAtRupees: number | null = null;
    if (compareAt.trim()) {
      compareAtRupees = parseWholeRupees(compareAt);
      if (compareAtRupees == null) {
        toast.error("Compare-at price must be a whole number of rupees");
        return;
      }
      if (compareAtRupees < priceRupees) {
        toast.error("Compare-at price cannot be less than the selling price");
        return;
      }
      const derived = discountPercentFromPrices(priceRupees, compareAtRupees);
      if (derived != null && !isValidDiscountPercent(derived)) {
        toast.error(`Discount can’t be more than ${MAX_DISCOUNT_PERCENT}%`);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && variant) {
        const response = await adminFetch(
          `/api/admin/products/${productId}/variants/${variant.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pricePaise: toPaise(priceRupees),
              compareAtPricePaise:
                compareAtRupees != null ? toPaise(compareAtRupees) : null,
              isAvailable,
            }),
          },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(body?.message ?? "Could not update variant");
        }

        const nextStockQty = Number(stockQty);
        if (nextStockQty !== variant.stockQty) {
          const stockResponse = await adminFetch(
            `/api/admin/products/${productId}/variants/${variant.id}/stock`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stockQty: nextStockQty }),
            },
          );
          if (!stockResponse.ok) {
            throw new Error("Could not update stock");
          }
        }
      } else {
        const response = await adminFetch(`/api/admin/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sizeMl: Number(sizeMl),
            pricePaise: toPaise(priceRupees),
            compareAtPricePaise:
              compareAtRupees != null ? toPaise(compareAtRupees) : undefined,
            stockQty: Number(stockQty),
          }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(body?.message ?? "Could not create variant");
        }
      }

      toast.success(isEdit ? "Variant updated" : "Variant added");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit variant" : "Add variant"}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="emphasis"
            size="md"
            disabled={submitting}
            className="cursor-pointer"
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={submitting}
            className="cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {!isEdit ? (
          <Field label="Size (ml)">
            <Input
              type="number"
              min={1}
              step={1}
              value={sizeMl}
              onChange={(event) => setSizeMl(event.target.value)}
            />
          </Field>
        ) : null}
        <Field label="Selling price (₹)">
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(event) => syncFromPrice(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Compare-at / MRP (₹)">
            <Input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={compareAt}
              onChange={(event) => syncFromCompareAt(event.target.value)}
              placeholder="Strikethrough price"
            />
          </Field>
          <Field label="Discount %">
            <Input
              type="number"
              min={0}
              max={MAX_DISCOUNT_PERCENT}
              step={1}
              inputMode="numeric"
              value={discountPercent}
              onChange={(event) => syncFromDiscount(event.target.value)}
              placeholder="e.g. 15"
            />
          </Field>
        </div>
        <Field label="Stock quantity">
          <Input
            type="number"
            min={0}
            step={1}
            value={stockQty}
            onChange={(event) => setStockQty(event.target.value)}
          />
        </Field>
        {isEdit ? (
          <Checkbox
            checked={isAvailable}
            onChange={setIsAvailable}
            label="Available for purchase"
          />
        ) : null}
      </div>
    </Modal>
  );
}
