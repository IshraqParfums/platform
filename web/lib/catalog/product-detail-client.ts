import type { ProductDetail } from "@ishraqparfums/shared";

/**
 * Client-safe product detail fetch. `getProductBySlug` in `lib/api/catalog.ts`
 * is `server-only` and cannot run from a client component — this hits the
 * public BFF route instead (`/api/products/[slug]`, no auth, same public
 * data the PDP itself renders). Used by `/wishlist`'s "Move to cart", the one
 * client-side flow that needs a product's variants.
 */
export async function getProductDetailClient(
  slug: string,
): Promise<ProductDetail | null> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as ProductDetail;
  } catch {
    return null;
  }
}
