"use client";

import { cn } from "@/lib/cn";
import { computePaginationSummary } from "@/lib/pagination/page-range";

/**
 * In-section numbered pagination for client-fetched lists (reviews, etc.).
 * Shop catalog keeps Link-based {@link PaginationNav}; this is for stateful pages.
 *
 * Current page stays a `<button>` (disabled) so focus isn’t destroyed on
 * re-render — swapping to a `<span>` caused scroll jumps.
 */
export function PaginationControls({
  page,
  pageSize,
  total,
  pending,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  pending?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { totalPages, rangeStart, rangeEnd, showAllPages } =
    computePaginationSummary(page, pageSize, total);

  if (totalPages <= 1 || total === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-8 flex flex-col items-start gap-4 border-t border-ink/[0.08] pt-6",
        className,
      )}
    >
      <p className="font-mono text-label-sm text-ink-faint">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <PageButton
          label="Previous"
          disabled={pending || page <= 1}
          onClick={() => onPageChange(page - 1)}
        />

        {showAllPages ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <PageButton
              key={n}
              label={String(n)}
              current={n === page}
              disabled={pending || n === page}
              onClick={() => onPageChange(n)}
            />
          ))
        ) : (
          <span className="px-3 font-mono text-label-sm text-ink-faint">
            Page {page} of {totalPages}
          </span>
        )}

        <PageButton
          label="Next"
          disabled={pending || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  );
}

function PageButton({
  label,
  current,
  disabled,
  onClick,
}: {
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors";

  return (
    <button
      type="button"
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        base,
        current
          ? "bg-ink text-cream-soft disabled:cursor-default disabled:opacity-100"
          : "cursor-pointer text-ink hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {label}
    </button>
  );
}
