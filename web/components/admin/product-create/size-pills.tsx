"use client";

import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import {
  CATALOG_SIZE_OPTIONS_ML,
  type CatalogSizeMl,
  type CreateSizeDraft,
  type CreateSizeDraftMap,
} from "@/lib/admin/product-create";
import {
  clampDiscountPercent,
  compareAtFromDiscountPercent,
  discountPercentFromPrices,
  isValidDiscountPercent,
  MAX_DISCOUNT_PERCENT,
  parseWholeRupees,
  suggestedCompareAt,
} from "@/lib/admin/variant-pricing";
import { cn } from "@/lib/cn";

function setDiscountFromDerived(pct: number | null): string {
  if (pct == null) return "";
  if (!isValidDiscountPercent(pct)) {
    return String(clampDiscountPercent(pct));
  }
  return pct > 0 ? String(pct) : pct === 0 ? "0" : "";
}

export function ProductCreateSizePills({
  sizes,
  onChange,
}: {
  sizes: CreateSizeDraftMap;
  onChange: (sizeMl: CatalogSizeMl, patch: Partial<CreateSizeDraft>) => void;
}) {
  function syncFromPrice(sizeMl: CatalogSizeMl, nextPrice: string) {
    const draft = sizes[sizeMl];
    const parsed = parseWholeRupees(nextPrice);
    if (parsed == null) {
      onChange(sizeMl, { priceRupees: nextPrice });
      return;
    }

    if (!draft.compareTouched) {
      const suggested = suggestedCompareAt(parsed);
      onChange(sizeMl, {
        priceRupees: nextPrice,
        compareAtRupees: String(suggested),
        discountPercent: setDiscountFromDerived(
          discountPercentFromPrices(parsed, suggested),
        ),
      });
      return;
    }

    const compareParsed = parseWholeRupees(draft.compareAtRupees);
    onChange(sizeMl, {
      priceRupees: nextPrice,
      discountPercent:
        compareParsed != null
          ? setDiscountFromDerived(
              discountPercentFromPrices(parsed, compareParsed),
            )
          : draft.discountPercent,
    });
  }

  function syncFromCompareAt(sizeMl: CatalogSizeMl, nextCompare: string) {
    const draft = sizes[sizeMl];
    const priceParsed = parseWholeRupees(draft.priceRupees);
    const compareParsed = parseWholeRupees(nextCompare);
    onChange(sizeMl, {
      compareTouched: true,
      compareAtRupees: nextCompare,
      discountPercent:
        priceParsed != null && compareParsed != null
          ? setDiscountFromDerived(
              discountPercentFromPrices(priceParsed, compareParsed),
            )
          : "",
    });
  }

  function syncFromDiscount(sizeMl: CatalogSizeMl, nextDiscount: string) {
    const draft = sizes[sizeMl];
    const trimmed = nextDiscount.trim();
    if (trimmed === "") {
      onChange(sizeMl, {
        compareTouched: true,
        discountPercent: "",
      });
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      onChange(sizeMl, {
        compareTouched: true,
        discountPercent: nextDiscount,
      });
      return;
    }

    const raw = Number(trimmed);
    const pct = clampDiscountPercent(raw);
    if (raw > MAX_DISCOUNT_PERCENT) {
      toast.error(`Discount can’t be more than ${MAX_DISCOUNT_PERCENT}%`);
    }

    const priceParsed = parseWholeRupees(draft.priceRupees);
    const nextCompare =
      priceParsed != null
        ? compareAtFromDiscountPercent(priceParsed, pct)
        : null;

    onChange(sizeMl, {
      compareTouched: true,
      discountPercent: String(pct),
      ...(nextCompare != null ? { compareAtRupees: String(nextCompare) } : {}),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {CATALOG_SIZE_OPTIONS_ML.map((sizeMl) => {
          const draft = sizes[sizeMl];
          return (
            <button
              key={sizeMl}
              type="button"
              onClick={() => onChange(sizeMl, { enabled: !draft.enabled })}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                draft.enabled
                  ? "border-ink bg-ink text-cream-soft"
                  : "border-ink/20 text-ink-soft hover:border-ink/40 hover:text-ink",
              )}
            >
              {sizeMl} ml
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {CATALOG_SIZE_OPTIONS_ML.filter((sizeMl) => sizes[sizeMl].enabled).map(
          (sizeMl) => {
            const draft = sizes[sizeMl];
            return (
              <div
                key={sizeMl}
                className="flex flex-col gap-2.5 rounded-md border border-ink/10 p-3"
              >
                <p className="text-sm font-medium text-ink">{sizeMl} ml</p>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                    Selling price (₹)
                  </span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={draft.priceRupees}
                    onChange={(event) =>
                      syncFromPrice(sizeMl, event.target.value)
                    }
                  />
                </label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                      Compare-at / MRP (₹)
                    </span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={draft.compareAtRupees}
                      onChange={(event) =>
                        syncFromCompareAt(sizeMl, event.target.value)
                      }
                      placeholder="Strikethrough price"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                      Discount %
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={MAX_DISCOUNT_PERCENT}
                      step={1}
                      inputMode="numeric"
                      value={draft.discountPercent}
                      onChange={(event) =>
                        syncFromDiscount(sizeMl, event.target.value)
                      }
                      placeholder="e.g. 15"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                    Stock
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={draft.stockQty}
                    onChange={(event) =>
                      onChange(sizeMl, { stockQty: event.target.value })
                    }
                  />
                </label>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
