"use client";

import Image from "next/image";
import Link from "next/link";
import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import type { CartViewLine } from "@/lib/cart/cart-view";
import { cartUnavailableReasonCopy } from "@/lib/cart/cart-view";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

const EASE = "duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)]";

export function CartLine({
  line,
  pending,
  onQuantityChange,
  onRemove,
}: {
  line: CartViewLine;
  pending: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const maxQty =
    line.stockQty !== null && line.stockQty > 0 ? line.stockQty : undefined;
  const badge =
    line.kind === "bespoke"
      ? "Bespoke"
      : line.collectionName;

  return (
    <article
      className={cn(
        "group/line grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-4 py-8 sm:gap-x-7 sm:py-9",
        !line.isAvailable && "opacity-70",
      )}
    >
      <Link
        href={`/products/${line.productSlug}`}
        className={cn(
          "relative h-[6.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-xl bg-deep ring-1 ring-line/35 sm:h-32 sm:w-32",
          "transition-[box-shadow,ring-color]",
          EASE,
          "hover:ring-gold/30",
        )}
      >
        {line.primaryImageUrl ? (
          <Image
            src={line.primaryImageUrl}
            alt=""
            fill
            sizes="128px"
            className={cn(
              "object-cover transition-transform",
              EASE,
              "group-hover/line:scale-[1.02]",
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-3xl text-gold-soft/45">
            {line.productName.charAt(0)}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-5 sm:gap-8">
          <div className="min-w-0">
            <Link
              href={`/products/${line.productSlug}`}
              className="font-display text-[1.125rem] font-semibold leading-snug tracking-[-0.015em] text-ink transition-colors duration-200 hover:text-rose-deep sm:text-[1.2rem]"
            >
              {line.productName}
            </Link>
            {line.shortDescription ? (
              <p className="mt-1.5 line-clamp-2 max-w-md text-[13px] leading-relaxed text-ink-soft sm:text-sm">
                {line.shortDescription}
              </p>
            ) : null}
            <p className="mt-2 text-sm tabular-nums text-ink-soft sm:text-[15px]">
              {line.sizeMl} ml
            </p>
            {badge ? (
              <p className="mt-2 inline-block font-mono text-label-sm uppercase tracking-[0.14em] text-ink-faint">
                {badge}
              </p>
            ) : null}
          </div>

          <p className="shrink-0 pt-0.5 text-[15px] font-semibold tabular-nums tracking-tight text-ink sm:text-base">
            {formatPaise(line.lineTotalPaise)}
          </p>
        </div>

        {!line.isAvailable ? (
          <p className="mt-3 text-sm text-rose-deep">
            {cartUnavailableReasonCopy(line.unavailableReason)}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5">
          {line.isAvailable ? (
            <CartQuantityStepper
              quantity={line.quantity}
              pending={pending}
              min={1}
              max={maxQty}
              size="sm"
              aria-label={`Quantity for ${line.productName}`}
              onChange={onQuantityChange}
            />
          ) : null}

          <button
            type="button"
            className={cn(
              "cursor-pointer font-mono text-label-sm uppercase tracking-wide text-ink-faint",
              "transition-colors duration-200 hover:text-ink disabled:opacity-40",
            )}
            disabled={pending}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
