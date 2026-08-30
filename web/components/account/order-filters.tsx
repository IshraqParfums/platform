"use client";

import { useRef, type KeyboardEvent } from "react";
import type { CustomerOrderStatusCounts } from "@ishraqparfums/shared";
import {
  ORDER_FILTERS,
  type OrderFilterId,
} from "@/lib/orders/order-status";
import { cn } from "@/lib/cn";

/**
 * Full status chips for order history. Counts come from the API so they stay
 * honest across pagination.
 */
export function OrderFilters({
  active,
  counts,
  onChange,
  className,
}: {
  active: OrderFilterId;
  counts: CustomerOrderStatusCounts;
  onChange: (id: OrderFilterId) => void;
  className?: string;
}) {
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;

    event.preventDefault();
    const next = (index + delta + ORDER_FILTERS.length) % ORDER_FILTERS.length;
    onChange(ORDER_FILTERS[next].id);
    pillRefs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Filter orders"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {ORDER_FILTERS.map((filter, index) => {
        const selected = filter.id === active;
        return (
          <button
            key={filter.id}
            ref={(node) => {
              pillRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(filter.id)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5",
              "font-ui text-[11px] uppercase tracking-[0.12em]",
              "transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite/30",
              selected
                ? "border-graphite/40 bg-shell text-graphite"
                : "border-graphite/12 text-graphite-faint hover:border-graphite/25 hover:text-graphite-soft",
            )}
          >
            {filter.label}
            <span className="ml-1.5 text-graphite-faint">{counts[filter.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
