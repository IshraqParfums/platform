"use client";

import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { cn } from "@/lib/cn";
import { computePaginationSummary } from "@/lib/pagination/page-range";

/**
 * Build a list URL from serializable pieces (safe to pass RSC → client).
 * `query` should omit `page` — this sets it.
 */
export function adminListHref(
  pathname: string,
  query: Record<string, string>,
  page: number,
): string {
  const qs = new URLSearchParams(query);
  qs.set("page", String(page));
  const serialized = qs.toString();
  return serialized ? `${pathname}?${serialized}` : `${pathname}?page=${page}`;
}

/**
 * Admin list pagination — same chrome as shop PaginationNav, but navigates
 * via pending-aware `push` so table skeletons show instead of a full remount.
 *
 * Takes `pathname` + `query` (no functions) so Server Components can pass props.
 */
export function AdminPaginationNav({
  page,
  pageSize,
  total,
  pathname,
  query = {},
  compact = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  pathname: string;
  /** Filter/search params excluding `page`. */
  query?: Record<string, string>;
  compact?: boolean;
}) {
  const { isPending, push } = useAdminListPending();

  if (total <= 0) {
    return null;
  }

  const { totalPages, rangeStart, rangeEnd, showAllPages } =
    computePaginationSummary(page, pageSize, total);

  function goTo(targetPage: number) {
    push(adminListHref(pathname, query, targetPage));
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center gap-5 border-t border-line/50",
        compact ? "mt-8 gap-3 pt-6" : "mt-16 pt-10",
      )}
    >
      <p className="font-mono text-label-sm text-ink-faint">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <PageControl
            disabled={isPending || page <= 1}
            label="Previous"
            onClick={() => goTo(page - 1)}
          />

          {showAllPages ? (
            Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <PageControl
                key={n}
                label={String(n)}
                current={n === page}
                disabled={isPending || n === page}
                onClick={n === page ? undefined : () => goTo(n)}
              />
            ))
          ) : (
            <span className="px-3 font-mono text-label-sm text-ink-faint">
              Page {page} of {totalPages}
            </span>
          )}

          <PageControl
            disabled={isPending || page >= totalPages}
            label="Next"
            onClick={() => goTo(page + 1)}
          />
        </div>
      ) : null}
    </nav>
  );
}

function PageControl({
  label,
  current,
  disabled,
  onClick,
}: {
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors";

  if (!onClick || disabled) {
    return (
      <span
        aria-current={current ? "page" : undefined}
        className={cn(
          base,
          current
            ? "bg-ink text-cream-soft"
            : "text-ink-faint opacity-40",
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, "cursor-pointer text-ink hover:bg-ink/5")}
    >
      {label}
    </button>
  );
}
