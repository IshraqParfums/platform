/**
 * Row returned by the one-shot owned quantity UPDATE (happy path).
 * Ownership + stock gate + write + cart itemCount in a single SQL round trip.
 */
export type OwnedQuantityUpdateRow = {
  id: string;
  cartId: string;
  quantity: number;
  productVariantId: string | null;
  bespokePerfumeId: string | null;
  bespokeSizeMl: number | null;
  pricePaise: number | null;
  availableStock: number | null;
  itemCount: number;
};

export type OwnedItemDeleteRow = {
  id: string;
  cartId: string;
  itemCount: number;
};
