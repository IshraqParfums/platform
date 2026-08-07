import type { AdminRevenuePoint } from "@ishraqparfums/shared";

export function toRevenuePoints(
  points: AdminRevenuePoint[],
): { label: string; value: number }[] {
  return points.map((point) => ({
    label: new Date(point.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    value: point.revenuePaise,
  }));
}
