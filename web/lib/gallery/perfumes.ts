/**
 * The gallery's catalogue: the same generated-bottle demo data the perfume
 * slider was built and themed against. Not the real product catalog — the
 * slider needs a full `PerfumeTheme` (bottle shape, glass tint, liquid
 * gradient) per entry, which is the artwork this file's data carries and
 * live inventory doesn't.
 *
 * Kept behind an async function, same seam as the original's lib/api.ts, so
 * swapping in a real endpoint later only means editing this file.
 */

import type { Perfume } from "@/components/perfume-slider";
import perfumes from "@/data/perfumes.json";

const CATALOGUE = perfumes as Perfume[];

export function getGalleryPerfumes(): Promise<Perfume[]> {
  return Promise.resolve(CATALOGUE);
}
