"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BESPOKE_MAX_LINE_QUANTITY,
  maxCatalogLineQuantity,
} from "@ishraqparfums/shared";
import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import type { CartViewLine } from "@/lib/cart/cart-view";
import { cartUnavailableReasonCopy } from "@/lib/cart/cart-view";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

const EASE = "duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)]";

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
    line.kind === "bespoke"
      ? BESPOKE_MAX_LINE_QUANTITY
      : line.stockQty !== null && line.stockQty > 0
        ? maxCatalogLineQuantity(line.stockQty)
        : undefined;
  const badge =
    line.kind === "bespoke"
      ? "Bespoke"
      : line.collectionName;

  /*
   * BUG FIX: bespoke lines used to link to `/products/${line.productSlug}`
   * along with catalog lines. A bespoke formula was never a catalog product
   * and has no product slug — both the guest cart (`cart-view.ts`,
   * `cartViewFromGuest`) and the server cart mapping hand this line a
   * placeholder `productSlug` rather than a real one, because there is no
   * real one to give it. The link resolved to `/products/bespoke`, a route
   * that has never existed. The formula's real page is
   * `/bespoke/brews/[id]`, the same one the saved-formula locker already
   * links to (`bespoke-saved-client.tsx`) — this line was simply never
   * updated to match when that route was built.
   */
  const href =
    line.kind === "bespoke"
      ? `/bespoke/brews/${line.bespokePerfumeId}`
      : `/products/${line.productSlug}`;

  return (
    <article
      className={cn(
        "group/line grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-4 py-8 sm:gap-x-7 sm:py-9",
        !line.isAvailable && "opacity-70",
      )}
    >
      <Link
        href={href}
        className={cn(
          "relative h-[6.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-[3px] bg-tobacco ring-1 ring-graphite/10 sm:h-32 sm:w-32",
          "transition-[box-shadow,ring-color]",
          EASE,
          "hover:ring-terra/35",
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
          <span className="flex h-full w-full items-center justify-center font-editorial text-3xl text-brass/45">
            {line.productName.charAt(0)}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-5 sm:gap-8">
          <div className="min-w-0">
            <Link
              href={href}
              className="font-editorial text-[19px] leading-snug text-graphite transition-colors duration-300 hover:text-terra sm:text-[21px]"
            >
              {line.productName}
            </Link>
            {line.shortDescription ? (
              <p className="mt-1.5 line-clamp-2 max-w-md text-[13px] leading-relaxed text-graphite-soft sm:text-sm">
                {line.shortDescription}
              </p>
            ) : null}
            <p className="mt-2 text-sm tabular-nums text-graphite-soft sm:text-[15px]">
              {line.sizeMl} ml
            </p>
            {badge ? (
              <p className="mt-2 inline-block font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                {badge}
              </p>
            ) : null}
          </div>

          <p className="shrink-0 pt-0.5 text-[15px] font-medium tabular-nums tracking-tight text-graphite sm:text-base">
            {formatPaise(line.lineTotalPaise)}
          </p>
        </div>

        {!line.isAvailable ? (
          <p className="mt-3 text-sm text-terra">
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
              "cursor-pointer font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint",
              "transition-colors duration-300 hover:text-terra disabled:cursor-default disabled:opacity-40",
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
