import type { AnalyticsRange } from "@ishraqparfums/shared";
import Link from "next/link";
import { cn } from "@/lib/cn";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

/** Server-safe (no client JS) range switcher — each option is a plain navigation link. */
export function RangePicker({
  basePath,
  active,
}: {
  basePath: string;
  active: AnalyticsRange;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-card p-1">
      {RANGES.map((range) => (
        <Link
          key={range.value}
          href={range.value === "30d" ? basePath : `${basePath}?range=${range.value}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            range.value === active
              ? "bg-ink text-cream-soft"
              : "text-ink-soft hover:bg-ink/5",
          )}
        >
          {range.label}
        </Link>
      ))}
    </div>
  );
}
