import type {
  ProductListItem,
  ProductListPrimaryImage,
} from "@ishraqparfums/shared";

/** List stills: gallery if present, else the single primary. */
export function catalogStillImages(
  product: Pick<ProductListItem, "images" | "primaryImage">,
): ProductListPrimaryImage[] {
  if (product.images?.length) return product.images;
  return product.primaryImage ? [product.primaryImage] : [];
}
