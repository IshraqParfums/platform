"use client";

import { useState, type ReactNode } from "react";
import type { ProductDetail } from "@ishraqparfums/shared";
import { RecordKicker } from "@/components/product-v2/ui/record";
import { ProductSmellsChapter } from "@/components/product-v2/product-smells-chapter";
import { ProductWearingChapter } from "@/components/product-v2/product-wearing-chapter";
import { ProductBackLabel } from "@/components/product-v2/product-back-label";
import { hasSmells, hasBackLabel } from "@/components/product-v2/chapters";

type RowKey = "smells" | "wearing" | "label";

/**
 * One row of the menu below. Independently toggleable — unlike `ProductFaq`
 * right above this on the page, these are different topics, not a Q&A flow,
 * so opening one shouldn't force another closed.
 *
 * Smooth via the CSS grid `grid-template-rows` trick rather than a max-height
 * guess: no library needed, and it animates to the panel's real height. The
 * affordance is a word, not a chevron — `ProductFaq`'s own stated rule is
 * that type carries state on this page — but "Show"/"Hide" rather than
 * FAQ's "Read"/"Close" so the two accordions don't read as identical.
 */
function InfoMenuRow({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-graphite/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-5 text-left"
      >
        <span className="font-editorial text-[20px] leading-[1.3] text-graphite">
          {label}
        </span>
        <span className="shrink-0 text-[13px] text-terra">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      <div
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * "More on this scent" — everything that isn't basic details, the story, or
 * the notes, tucked behind a menu of independently-openable rows so the page
 * above it stays short and readable. Each row reuses the same chapter
 * component this menu replaced on the page, with its own title suppressed
 * (`hideKicker`) since the row's button label is already that title.
 */
export function ProductInfoMenu({ product }: { product: ProductDetail }) {
  const [open, setOpen] = useState<Record<RowKey, boolean>>({
    smells: false,
    wearing: false,
    label: false,
  });

  function toggle(key: RowKey) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
          <InfoMenuRow
            key={row.key}
            label={row.label}
            open={open[row.key]}
            onToggle={() => toggle(row.key)}
          >
            {row.content}
          </InfoMenuRow>
        ))}
      </div>
    </section>
  );
}
