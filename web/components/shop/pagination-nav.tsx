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
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex flex-col items-center gap-5 border-t border-line/50 pt-10"
    >
      <p className="font-mono text-label-sm text-ink-faint">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>

      <div className="flex items-center gap-2">
        <PageLink
          href={page > 1 ? buildHref(page - 1) : undefined}
          label="Previous"
        />

        {/* Numbered links are only worth it while the count stays scannable —
            beyond that a "Page X of Y" readout serves the same purpose
            without a very long button row. */}
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
          <span className="px-3 font-mono text-label-sm text-ink-faint">
            Page {page} of {totalPages}
          </span>
        )}

        <PageLink
          href={page < totalPages ? buildHref(page + 1) : undefined}
          label="Next"
        />
      </div>
    </nav>
  );
}

function PageLink({
  href,
  label,
  current,
}: {
  /** Undefined renders a disabled state instead of a link. */
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
            ? "bg-ink text-cream-soft"
            : "text-ink-faint opacity-40",
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className={cn(base, "text-ink hover:bg-ink/5")}>
      {label}
    </Link>
  );
}
