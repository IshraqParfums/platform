"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const EASE = "duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)]";

export function CartQuantityStepper({
  quantity,
  onChange,
  pending = false,
  min = 1,
  max,
  size = "md",
  className,
  "aria-label": ariaLabel = "Quantity",
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  pending?: boolean;
  /** Lowest allowed value. Use `0` on PDP so − removes the line. */
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}) {
  const canDecrease = quantity > min && !pending;
  const canIncrease =
    !pending && (max === undefined || quantity < max);

  const btn =
    size === "sm"
      ? "h-9 w-9 sm:h-8 sm:w-8"
      : "h-11 w-11 sm:h-10 sm:w-10";
  const count =
    size === "sm"
      ? "min-w-9 text-sm sm:min-w-8"
      : "min-w-11 text-base sm:min-w-10";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border border-ink/20 bg-transparent",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={cn(
          "flex cursor-pointer items-center justify-center text-ink/70 transition-colors",
          EASE,
          "hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-35",
          btn,
        )}
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <span
        className={cn(
          "text-center font-mono tabular-nums text-ink",
          count,
        )}
      >
        {quantity}
      </span>
      <button
        type="button"
        className={cn(
          "flex cursor-pointer items-center justify-center text-ink/70 transition-colors",
          EASE,
          "hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-35",
          btn,
        )}
        disabled={!canIncrease}
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
