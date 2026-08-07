"use client";

import type { AdminLowStockVariant } from "@ishraqparfums/shared";
import Link from "next/link";
import { useState } from "react";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { cn } from "@/lib/cn";

const QUICK_ADDS = [5, 10, 20] as const;
const SKELETON_WIDTHS = ["48%", "22%", "20%", "24%", "28%"];

export function LowStockTable({ rows }: { rows: AdminLowStockVariant[] }) {
  const { isPending, refresh } = useAdminListPending();
  const [selected, setSelected] = useState<AdminLowStockVariant | null>(null);
  const [stockQty, setStockQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openRestock(row: AdminLowStockVariant) {
    setSelected(row);
    setStockQty(String(row.stockQty));
  }

  function applyQuickAdd(delta: number) {
    if (!selected) return;
    const current = Number(stockQty);
    const base = Number.isFinite(current) ? current : selected.stockQty;
    setStockQty(String(base + delta));
  }

  async function confirmRestock() {
    if (!selected) return;
    const nextQty = Number(stockQty);
    if (!Number.isInteger(nextQty) || nextQty < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }
    if (nextQty < selected.reservedQty) {
      toast.error(
        `Stock cannot be below reserved quantity (${selected.reservedQty})`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminFetch(
        `/api/admin/products/${selected.productId}/variants/${selected.variantId}/stock`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockQty: nextQty }),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not update stock");
      }

      toast.success("Stock updated");
      setSelected(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-ink/10 bg-card">
        <table className="w-full min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-faint">
              <th className="px-4 py-3 font-mono text-label-sm uppercase">
                Product
              </th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase">
                Size
              </th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase">
                Stock
              </th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase">
                Reserved
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              Array.from({ length: 3 }, (_, rowIndex) => (
                <tr
                  key={`skeleton-${rowIndex}`}
                  className="border-b border-ink/[0.06] last:border-0"
                >
                  {SKELETON_WIDTHS.map((width, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <Skeleton
                        variant="shimmer"
                        className="h-3.5 max-w-full"
                        style={{ width }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">
                  No low-stock variants.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.variantId}
                  className="border-b border-ink/[0.06] last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${row.productId}`}
                      className="font-medium text-ink hover:text-gold-deep"
                    >
                      {row.productName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{row.sizeMl} ml</td>
                  <td className="px-4 py-3 font-medium text-ink">{row.stockQty}</td>
                  <td className="px-4 py-3 text-ink-soft">{row.reservedQty}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => openRestock(row)}
                    >
                      Restock
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={selected !== null}
        title="Restock variant"
        onClose={() => {
          if (!submitting) setSelected(null);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={submitting}
              onClick={() => setSelected(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={submitting}
              onClick={() => void confirmRestock()}
              className="cursor-pointer"
            >
              {submitting ? "Saving…" : "Update stock"}
            </Button>
          </div>
        }
      >
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <div className="text-ink-soft">
              <p className="font-medium text-ink">
                {selected.productName} · {selected.sizeMl} ml
              </p>
              <p className="mt-1">
                Current stock {selected.stockQty}
                {selected.reservedQty > 0
                  ? ` · ${selected.reservedQty} reserved`
                  : null}
              </p>
            </div>

            <div>
              <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Quick add
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_ADDS.map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    disabled={submitting}
                    onClick={() => applyQuickAdd(delta)}
                    className={cn(
                      "cursor-pointer rounded-full border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink",
                      "transition-colors hover:border-ink/35 hover:bg-ink/5 disabled:opacity-50",
                    )}
                  >
                    +{delta}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Stock quantity
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                value={stockQty}
                onChange={(event) => setStockQty(event.target.value)}
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
