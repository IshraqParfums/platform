export type ProductRatingSummary = {
  ratingAverage: number | null;
  reviewCount: number;
};

type RatingAggregateRow = {
  productId: string;
  _avg: { rating: number | null };
  _count: { rating: number };
};

export function buildRatingSummaryMap(
  productIds: string[],
  rows: RatingAggregateRow[],
): Map<string, ProductRatingSummary> {
  const map = new Map<string, ProductRatingSummary>();

  for (const id of productIds) {
    map.set(id, { ratingAverage: null, reviewCount: 0 });
  }

  for (const row of rows) {
    map.set(row.productId, {
      ratingAverage:
        row._count.rating > 0 && row._avg.rating !== null
          ? Math.round(row._avg.rating * 10) / 10
          : null,
      reviewCount: row._count.rating,
    });
  }

  return map;
}
