/**
 * Client-safe scent-family palette — mirror of
 * @ishraqparfums/bespoke-engine family-colors.
 * Drift is guarded by packages/shared palette parity test against the engine.
 */

export type BespokeDimension =
  | "floral"
  | "woody"
  | "spicy"
  | "green"
  | "aldehydic"
  | "gourmand"
  | "animalic"
  | "earthy"
  | "citrus"
  | "musky";

export const BESPOKE_DIMENSIONS: BespokeDimension[] = [
  "floral",
  "woody",
  "spicy",
  "green",
  "aldehydic",
  "gourmand",
  "animalic",
  "earthy",
  "citrus",
  "musky",
];

export const BESPOKE_DIMENSION_LABEL: Record<BespokeDimension, string> = {
  floral: "Floral",
  woody: "Woody",
  spicy: "Spicy",
  green: "Green",
  aldehydic: "Aldehydic",
  gourmand: "Gourmand",
  animalic: "Animalic",
  earthy: "Earthy",
  citrus: "Citrus",
  musky: "Musky",
};

export interface BespokeFamilyPalette {
  accent: string;
  accentSoft: string;
  aura: string;
}

export const BESPOKE_FAMILY_PALETTE: Record<
  BespokeDimension,
  BespokeFamilyPalette
> = {
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

export const BESPOKE_FAMILY_COLOR: Record<BespokeDimension, string> =
  Object.fromEntries(
    BESPOKE_DIMENSIONS.map((d) => [d, BESPOKE_FAMILY_PALETTE[d].accent]),
  ) as Record<BespokeDimension, string>;

/** Teaser marquee — material names only (no dosing). Generated from engine materials. */
export const BESPOKE_TEASER_MATERIALS: readonly string[] = [
  "Jasmine Sambac",
  "Rose Wardia",
  "Hedione",
  "Bergamot",
  "Iso E Super",
  "Cashmeran",
  "Patchouli",
  "Vetiver",
  "Vanillin",
  "Ambroxan",
  "Galaxolide",
  "Cardamom",
  "Black Pepper",
  "Oud Oliffac",
  "Cis-3-hexenyl acetate",
];
