import type { AnalyticsRange } from "@ishraqparfums/shared";

const RANGE_SET = new Set<string>(["7d", "30d", "90d", "all"]);

export function isAnalyticsRange(
  value: string | undefined,
): value is AnalyticsRange {
  return !!value && RANGE_SET.has(value);
}

export function parseAnalyticsRange(
  value: string | undefined,
  fallback: AnalyticsRange = "30d",
): AnalyticsRange {
  return isAnalyticsRange(value) ? value : fallback;
}
