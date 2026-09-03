import { cn } from "@/lib/cn";

function Star({ fill }: { fill: number }) {
  const id = `star-${Math.round(fill * 100)}`;
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

export function Rating({
  average,
  count,
  className,
  showEmpty = false,
  showValue = true,
}: {
  average: number | null;
  count: number;
  className?: string;
  /** Render a muted placeholder instead of nothing when a product has no reviews. */
  showEmpty?: boolean;
  /** Hide the numeric “4.3 (18)” when the score already sits next to the stars. */
  showValue?: boolean;
}) {
  if (average === null || count === 0) {
    if (!showEmpty) return null;
    return (
      <span
        className={cn(
          "flex h-3.5 items-center font-mono text-label-sm text-ink-faint",
          className,
        )}
      >
        No reviews yet
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span className="flex text-gold" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} fill={Math.max(0, Math.min(1, average - i))} />
        ))}
      </span>
      {showValue ? (
        <span className="font-mono text-label-sm text-ink-faint">
          {average.toFixed(1)} ({count})
        </span>
      ) : null}
      <span className="sr-only">
        Rated {average.toFixed(1)} out of 5 from {count} review
        {count === 1 ? "" : "s"}
      </span>
    </span>
  );
}
