"use client";

import { ShareButton, type ShareButtonVariant } from "@/components/share/share-button";
import {
  buildProductSharePayload,
  shopProductPath,
} from "@/lib/share/share-payload";

type ProductShareProps = {
  /** Product display name. */
  name: string;
  /**
   * Shop PDP slug — builds `/products/{slug}`.
   * Omit on the public PDP to share the current page URL.
   */
  slug?: string;
  /** Absolute or relative URL override (wins over `slug`). */
  url?: string;
  /** Optional short description for richer share text. */
  blurb?: string;
  variant?: ShareButtonVariant;
  className?: string;
  menuAlign?: "left" | "right";
};

/**
 * Product-domain share control — builds branded copy, then delegates to ShareButton.
 * Use on the shop PDP and in admin (pass `slug` so the public URL is shared).
 */
export function ProductShare({
  name,
  slug,
  url,
  blurb,
  variant = "icon",
  className,
  menuAlign = "right",
}: ProductShareProps) {
  const targetUrl =
    url ?? (slug !== undefined ? shopProductPath(slug) : undefined);

  const payload = buildProductSharePayload({
    name,
    url: targetUrl,
    blurb,
  });

  return (
    <ShareButton
      title={payload.title}
      text={payload.text}
      url={targetUrl}
      variant={variant}
      className={className}
      label="Share"
      menuAlign={menuAlign}
    />
  );
}
