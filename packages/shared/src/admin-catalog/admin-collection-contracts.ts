export type CollectionStatus = "ACTIVE" | "ARCHIVED";

export interface AdminCollectionResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CollectionStatus;
  /** Admin-curated homepage slot, 1-based. Null = not shown on the homepage. */
  homeRank: number | null;
}

export interface CreateCollectionBody {
  name: string;
  slug: string;
  description?: string | null;
}

export interface UpdateCollectionBody {
  name?: string;
  slug?: string;
  description?: string | null;
  homeRank?: number | null;
}

export interface ArchiveCollectionResponse {
  collection: AdminCollectionResponse;
  cascadedProductCount: number;
}

export interface RestoreCollectionResponse {
  collection: AdminCollectionResponse;
  restoredProductCount: number;
  leftArchivedCount: number;
}
