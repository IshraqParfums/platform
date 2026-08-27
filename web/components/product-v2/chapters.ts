import type { ProductDetail } from "@ishraqparfums/shared";

/** Two journal columns from md up — smells/notes, wear/keep. */
export const pdpSplitPairClass =
  "grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-0 md:[&>:not(:first-child)]:border-l md:[&>:not(:first-child)]:border-graphite/10 md:[&>:not(:first-child)]:pl-16 lg:gap-x-20 lg:[&>:not(:first-child)]:pl-20";

/**
 * Which sections a given product actually has.
 *
 * The page uses these to decide whether to render a band at all — a band
 * whose only child self-nulls would otherwise leave a stripe of empty
 * parchment. The section components still self-null independently; that
 * stays the real safety net, this just avoids the empty frame around it.
 */

/**
 * "How it smells" — the plain-English answer, for someone who doesn't read
 * note pyramids.
 */
export function hasSmells(product: ProductDetail): boolean {
  const profile = product.olfactoryProfile;
  if (!profile) return false;
  return Boolean(
    profile.family ||
      profile.character.length > 0 ||
      profile.season.length > 0 ||
      profile.occasion.length > 0 ||
      profile.intensity ||
      profile.sillage ||
      profile.longevity,
  );
}

export function hasNotes(product: ProductDetail): boolean {
  const pyramid = product.notesPyramid;
  if (!pyramid) return false;
  return Boolean(
    pyramid.opening?.notes.length ||
      pyramid.heart?.notes.length ||
      pyramid.base?.notes.length,
  );
}

export function hasMeaning(product: ProductDetail): boolean {
  return product.meaningStory !== null;
}

/** The back label — specification only: format fields plus who it's for. */
export function hasBackLabel(product: ProductDetail): boolean {
  const format = product.format;
  const hasFormat = Boolean(
    format &&
      (format.formatLabel ||
        format.concentration ||
        format.application ||
        format.bottleDescription),
  );
  return hasFormat || Boolean(product.olfactoryProfile?.gender);
}
