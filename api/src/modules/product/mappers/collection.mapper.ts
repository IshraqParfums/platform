import type {
  AdminCollectionResponse,
  CollectionSummary,
} from '@ishraqparfums/shared';
import type { CollectionWithActiveProductCount } from '../collection.repository';

type CollectionSummarySource = Pick<
  CollectionWithActiveProductCount,
  'name' | 'slug' | 'description' | 'editorialLabel'
> & {
  _count: { products: number };
};

export function toCollectionSummary(
  collection: CollectionSummarySource,
): CollectionSummary {
  return {
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    editorialLabel: collection.editorialLabel,
    productCount: collection._count.products,
  };
}

export function toAdminCollectionResponse(
  collection: CollectionWithActiveProductCount,
): AdminCollectionResponse {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    editorialLabel: collection.editorialLabel,
    productCount: collection._count.products,
    status: collection.status,
    homeRank: collection.homeRank,
  };
}
