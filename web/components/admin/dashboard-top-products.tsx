"use client";

import type { AdminTopProduct } from "@ishraqparfums/shared";
import Link from "next/link";
import { useState } from "react";
import { TopProductsTable } from "@/components/admin/top-products-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatPaise } from "@/lib/format/money";

export function DashboardTopProducts({
  items,
  previewCount = 5,
}: {
  items: AdminTopProduct[];
  previewCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const preview = items.slice(0, previewCount);
  const hasMore = items.length > previewCount;

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-faint">No sales in this range yet.</p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {preview.map((item) => (
          <Link
            key={`${item.productId}-${item.variantId ?? "line"}`}
            href={`/admin/products/${item.productId}`}
            className="flex items-center justify-between gap-3 rounded-md text-sm transition-colors hover:bg-ink/[0.03]"
          >
            <div className="min-w-0 py-0.5">
              <p className="truncate font-medium text-ink hover:text-gold-deep">
                {item.productName}
              </p>
              <p className="text-ink-faint">
                {item.sizeMl != null
                  ? `${item.sizeMl} ml · ${item.quantitySold} sold`
                  : `${item.quantitySold} sold`}
              </p>
            </div>
            <p className="shrink-0 font-medium text-ink">
              {formatPaise(item.revenuePaise)}
            </p>
          </Link>
        ))}
      </div>

      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          View all ({items.length})
        </Button>
      ) : null}

      <Modal
        open={open}
        title="Top products"
        onClose={() => setOpen(false)}
        panelClassName="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        <TopProductsTable items={items} />
      </Modal>
    </>
  );
}
