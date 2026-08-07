/**
 * Client rules aligned with Nest `ALLOWED_IMAGE_MIME_TYPES` / `MAX_IMAGE_BYTES`.
 */
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProductImageFileRejection =
  | { ok: true }
  | { ok: false; reason: string };

export function validateProductImageFile(file: File): ProductImageFileRejection {
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      reason: `${file.name}: use JPEG, PNG, or WebP.`,
    };
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: `${file.name}: must be 5 MB or smaller.`,
    };
  }
  return { ok: true };
}
