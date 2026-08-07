/**
 * The scent-family colour palette — the exact triples the retail catalogue's
 * own bottle generator uses (see the family-hue table baked into every
 * generated perfume's theme), so a family reads as the same colour whether
 * it's a real bottle on /collection, a chart on ScentPrism, or the essence
 * forming during the bespoke quiz. No directive on this file on purpose: it
 * has to be importable from both client components (the quiz's live corner
 * animation) and the "use server" action that returns a matched accord's
 * colour theme — plain data, safe either way.
 */

import { DIMENSIONS, type Dimension } from "./types.js";

export interface FamilyPalette {
  accent: string;
  accentSoft: string;
  aura: string;
}

export const FAMILY_PALETTE: Record<Dimension, FamilyPalette> = {
  floral: { accent: "#D98BA6", accentSoft: "#F0C3D3", aura: "#5A1E2E" },
  woody: { accent: "#A9762F", accentSoft: "#D9B877", aura: "#3A2410" },
  spicy: { accent: "#C25A2E", accentSoft: "#E8A878", aura: "#4A1E0C" },
  green: { accent: "#6B8F5A", accentSoft: "#A8C89A", aura: "#243A1C" },
  aldehydic: { accent: "#8FA8C2", accentSoft: "#C6D6E8", aura: "#1E2E3E" },
  gourmand: { accent: "#B8863E", accentSoft: "#E6C48A", aura: "#4A2E10" },
  animalic: { accent: "#7A5A42", accentSoft: "#B8987A", aura: "#2E2018" },
  earthy: { accent: "#6E5A3E", accentSoft: "#A8926E", aura: "#2A2214" },
  citrus: { accent: "#D9A62E", accentSoft: "#F0D688", aura: "#4A360C" },
  musky: { accent: "#9C8FA0", accentSoft: "#D0C6D6", aura: "#302838" },
};

/** Single accent hex, for callers that only need one colour (chips, dots). */
export const FAMILY_COLOR: Record<Dimension, string> = Object.fromEntries(
  DIMENSIONS.map((d) => [d, FAMILY_PALETTE[d].accent]),
) as Record<Dimension, string>;

export function dominantDimension(vector: Partial<Record<Dimension, number>>): Dimension | null {
  let best: Dimension | null = null;
  let bestVal = 0;
  for (const dim of DIMENSIONS) {
    const v = vector[dim] ?? 0;
    if (v > bestVal) {
      best = dim;
      bestVal = v;
    }
  }
  return best;
}

/** The runner-up family, for the essence widget's two-tone cap/collar — the
 *  same "second-highest axis" idea the server sends as ColorTheme.secondary,
 *  just computed client-side from the fingerprint instead of a real accord. */
export function secondaryDimension(vector: Partial<Record<Dimension, number>>): Dimension | null {
  let first: Dimension | null = null;
  let firstVal = 0;
  let second: Dimension | null = null;
  let secondVal = 0;
  for (const dim of DIMENSIONS) {
    const v = vector[dim] ?? 0;
    if (v > firstVal) {
      second = first;
      secondVal = firstVal;
      first = dim;
      firstVal = v;
    } else if (v > secondVal) {
      second = dim;
      secondVal = v;
    }
  }
  return secondVal > 0 ? second : null;
}
