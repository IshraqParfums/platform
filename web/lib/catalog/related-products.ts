import 'server-only';

import type { ProductDetail, ProductListItem } from '@ishraqparfums/shared';
import { getCollections, getProducts } from '@/lib/api/catalog';

const RELATED_LIMIT = 4;

/**
 * Curated “More to explore”: 2 from the same collection (exclude current),
 * then 1 each from two different other collections. Pads from leftovers if short.
 */
export async function getRelatedProducts(
  product: ProductDetail,
): Promise<ProductListItem[]> {
  const currentSlug = product.slug;
  const currentCollection = product.collection.slug;

  const [samePage, collections] = await Promise.all([
    getProducts({
      collection: currentCollection,
      pageSize: 8,
      sort: 'newest',
    }),
    getCollections(),
  ]);

  const same = samePage.items.filter((item) => item.slug !== currentSlug);
  const picked: ProductListItem[] = same.slice(0, 2);
  const pickedSlugs = new Set(picked.map((item) => item.slug));

  const otherCollections = collections
    .filter((collection) => collection.slug !== currentCollection)
    .slice(0, 2);

  const otherPages = await Promise.all(
    otherCollections.map((collection) =>
      getProducts({
        collection: collection.slug,
        pageSize: 4,
        sort: 'newest',
      }),
    ),
  );

  for (const page of otherPages) {
    if (picked.length >= RELATED_LIMIT) break;
    const candidate = page.items.find(
      (item) => item.slug !== currentSlug && !pickedSlugs.has(item.slug),
    );
    if (candidate) {
      picked.push(candidate);
      pickedSlugs.add(candidate.slug);
    }
  }

  // Pad from remaining same-collection, then a broad catalog fetch.
  if (picked.length < RELATED_LIMIT) {
    for (const item of same) {
      if (picked.length >= RELATED_LIMIT) break;
      if (pickedSlugs.has(item.slug)) continue;
      picked.push(item);
      pickedSlugs.add(item.slug);
    }
  }

  if (picked.length < RELATED_LIMIT) {
    const catalog = await getProducts({ pageSize: 12, sort: 'newest' });
    for (const item of catalog.items) {
      if (picked.length >= RELATED_LIMIT) break;
      if (item.slug === currentSlug || pickedSlugs.has(item.slug)) continue;
      picked.push(item);
      pickedSlugs.add(item.slug);
    }
  }

  return picked.slice(0, RELATED_LIMIT);
}
