"use client";

import { type ReactNode } from "react";
import type { ProductDetail } from "@ishraqparfums/shared";
import { RecordKicker } from "@/components/product-v2/ui/record";
import {
  RecordDisclosure,
  useExclusiveDisclosure,
} from "@/components/product-v2/ui/record-disclosure";
import { ProductSmellsChapter } from "@/components/product-v2/product-smells-chapter";
import { ProductWearingChapter } from "@/components/product-v2/product-wearing-chapter";
import { ProductBackLabel } from "@/components/product-v2/product-back-label";
import { hasSmells, hasBackLabel } from "@/components/product-v2/chapters";

type RowKey = "smells" | "wearing" | "label";

/**
 * "More on this scent" — everything that isn't basic details, the story, or
 * the notes, tucked behind a menu of rows so the page above it stays short.
 * Each row reuses the same chapter component this menu replaced on the page,
 * with its own title suppressed (`hideKicker`) since the row's button label
 * is already that title.
 *
 * One row open at a time — same exclusive rule as `ProductFaq`, via
 * `useExclusiveDisclosure`. Shared chrome lives in `RecordDisclosure`.
 */
export function ProductInfoMenu({ product }: { product: ProductDetail }) {
  const { isOpen, toggle } = useExclusiveDisclosure<RowKey>();

  const rows: Array<{ key: RowKey; label: string; content: ReactNode }> = [
    hasSmells(product)
      ? {
          key: "smells" as const,
          label: "How it smells",
          content: (
            <ProductSmellsChapter
              olfactoryProfile={product.olfactoryProfile}
              hideKicker
            />
          ),
        }
      : null,
    {
      key: "wearing" as const,
      label: "Wearing & care",
      content: <ProductWearingChapter />,
    },
    hasBackLabel(product)
      ? {
          key: "label" as const,
          label: "On the label",
          content: (
            <ProductBackLabel
              format={product.format}
              olfactoryProfile={product.olfactoryProfile}
              hideKicker
            />
          ),
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) return null;

  return (
    <section>
      <RecordKicker>More on this scent</RecordKicker>
      <div className="mt-7">
        {rows.map((row) => (
          <RecordDisclosure
            key={row.key}
            open={isOpen(row.key)}
            onToggle={() => toggle(row.key)}
            title={row.label}
            closedAffordance="Show"
            openAffordance="Hide"
          >
            {row.content}
          </RecordDisclosure>
        ))}
      </div>
    </section>
  );
}
