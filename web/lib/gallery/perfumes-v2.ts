/**
 * Same seam as lib/gallery/perfumes.ts, typed against the v2 slider instead.
 * Both read the same generated-bottle demo catalogue (data/perfumes.json) —
 * this file exists only so /galleryv2 doesn't import a type from the v1
 * component tree it's meant to be independent of.
 */

import type { Perfume } from "@/components/perfume-slider-v2";
import perfumes from "@/data/perfumes.json";

const CATALOGUE = perfumes as Perfume[];

export function getGalleryPerfumes(): Promise<Perfume[]> {
  return Promise.resolve(CATALOGUE);
}
