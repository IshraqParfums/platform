import { cn } from "@/lib/cn";

function Star({ fill }: { fill: number }) {
  const id = `pdp-star-${Math.round(fill * 100)}`;
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="currentColor" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
        fill={`url(#${id})`}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Rating for the v2 PDP only.
 *
 * Same reason `product-price.tsx` exists: the shared `ui/rating.tsx` renders
 * its count in `text-ink-faint` at 11px — a v1 token measuring under 3:1 on
 * parchment — and it's used by `ProductCard` on `/shop`, so it can't be
 * restyled in place without repainting another page.
 *
 * Stars in terra, count at the secondary floor and a readable size.
 */
export function ProductRating({
  average,
  count,
  className,
}: {
  average: number | null;
  count: number;
  className?: string;
}) {
  if (average === null || count <= 0) return null;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex items-center gap-0.5 text-terra" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} fill={Math.min(1, Math.max(0, average - i))} />
        ))}
      </span>
      <span className="text-[14px] text-graphite-soft">
        {average.toFixed(1)}
        <span className="sr-only"> out of 5 stars</span> ({count})
      </span>
    </span>
  );
}
