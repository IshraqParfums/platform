import { formatPaise } from "@/lib/format/money";

export type ChartValueFormat = "number" | "paise";

export function resolveChartValueFormat(format: ChartValueFormat) {
  return format === "paise" ? formatPaise : (value: number) => String(value);
}
