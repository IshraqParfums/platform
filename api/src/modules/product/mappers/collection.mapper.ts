import type { CollectionSummary } from '@ishraqparfums/shared';
import type { Collection } from '@prisma/client';

export function toCollectionSummary(collection: Collection): CollectionSummary {
  return {
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
  };
}
