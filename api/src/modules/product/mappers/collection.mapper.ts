import type {
  AdminCollectionResponse,
  CollectionSummary,
} from '@ishraqparfums/shared';
import type { Collection } from '@prisma/client';

export function toCollectionSummary(collection: Collection): CollectionSummary {
  return {
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
  };
}

export function toAdminCollectionResponse(
  collection: Collection,
): AdminCollectionResponse {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    status: collection.status,
    homeRank: collection.homeRank,
  };
}
