import { revalidateTag } from "next/cache";

/**
 * Cache tags for public catalog fetches.
 * Revalidate from admin route handlers after mutations — no Nest→Next coupling.
 */
export const CATALOG_CACHE_TAGS = {
  products: "catalog:products",
  collections: "catalog:collections",
  product: (slug: string) => `catalog:product:${slug}`,
} as const;

/** Immediate expire so storefront drops stale buyability after admin writes. */
const EXPIRE_NOW = { expire: 0 } as const;

function bust(tag: string): void {
  revalidateTag(tag, EXPIRE_NOW);
}

/** Product / variant / stock / image mutations. */
export function revalidateCatalogProducts(slug?: string | null): void {
  bust(CATALOG_CACHE_TAGS.products);
  bust(CATALOG_CACHE_TAGS.collections);
  if (slug) bust(CATALOG_CACHE_TAGS.product(slug));
}

/** Collection archive / restore / public-facing collection edits. */
export function revalidateCatalogCollections(): void {
  bust(CATALOG_CACHE_TAGS.products);
  bust(CATALOG_CACHE_TAGS.collections);
}
