import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Prev/Next + numbered links, all plain `<Link>`s — a page change is a
 * navigation, not client state. `buildHref` lets the caller keep filter/sort
 * query params without this component knowing about them.
 */
export function PaginationNav({
  page,
  pageSize,
  total,
  buildHref,
  compact = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
  /** Tighter spacing for admin lists. */
  compact?: boolean;
}) {
  if (total <= 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center gap-5 border-t border-graphite/10",
        compact ? "mt-8 gap-3 pt-6" : "mt-16 pt-10",
      )}
    >
      <p className="text-[13px] text-graphite-soft">
        Showing {rangeStart}-{rangeEnd} of {total}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <PageLink
            href={page > 1 ? buildHref(page - 1) : undefined}
            label="Previous"
          />

          {totalPages <= 7 ? (
            Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <PageLink
                key={n}
                href={n === page ? undefined : buildHref(n)}
                label={String(n)}
                current={n === page}
              />
            ))
          ) : (
            <span className="px-3 text-[13px] text-graphite-soft">
              Page {page} of {totalPages}
            </span>
          )}

          <PageLink
            href={page < totalPages ? buildHref(page + 1) : undefined}
            label="Next"
          />
        </div>
      ) : null}
    </nav>
  );
}

function PageLink({
  href,
  label,
  current,
}: {
  href?: string;
  label: string;
  current?: boolean;
}) {
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors";

  if (!href) {
    return (
      <span
        aria-current={current ? "page" : undefined}
        className={cn(
          base,
          current
            ? "bg-graphite text-paper"
            : "text-graphite-faint opacity-40",
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(base, "text-graphite hover:bg-graphite/5")}
    >
      {label}
    </Link>
  );
}
