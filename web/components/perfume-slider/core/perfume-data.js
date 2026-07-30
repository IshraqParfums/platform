/**
 * Perfume data for the spray slider.
 *
 * This module is pure data — no DOM, no framework. Swap `PERFUMES` for a list
 * coming from the API and the slider keeps working, as long as each entry keeps
 * the same shape. `theme` is what drives the look of the bottle: glass tint,
 * juice colour, cap material, silhouette and the accent used for the mist.
 *
 * @typedef {'flacon'|'orb'|'obelisk'|'cylinder'|'faceted'|'flask'|'teardrop'} BottleShape
 * @typedef {'knurl'|'grain'|'facets'|'none'} CapTexture
 *
 * @typedef {object} PerfumeTheme
 * @property {string} accent      Primary accent — mist, glow, UI highlights.
 * @property {string} accentSoft  Lighter accent for text and fine detail.
 * @property {string} aura        Ambient stage wash behind the bottle.
 * @property {BottleShape} shape
 * @property {string} glass       Glass tint (translucent).
 * @property {[string, string, string]} juice  Liquid gradient: top, middle, bottom.
 * @property {number} fill        Liquid level, 0–1 of the body height.
 * @property {{c1:string,c2:string,c3:string,texture:CapTexture,w:number,h:number,r:number}} cap
 * @property {{c1:string,c2:string}} collar   Metal ring under the actuator.
 * @property {{style:'foil'|'etched'|'plate',ink:string,plate:string}} label
 *
 * @typedef {object} Perfume
 * @property {string} id
 * @property {string} name
 * @property {string} collection
 * @property {string} concentration
 * @property {string} size
 * @property {string} price
 * @property {string} tagline
 * @property {{top:string[],heart:string[],base:string[]}} notes
 * @property {PerfumeTheme} theme
 */

/** @type {Perfume[]} */
export const PERFUMES = [
  {
    id: "attar-bazaar",
    name: "Attar Bazaar",
    collection: "Arabic Mukhallat",
    concentration: "Extrait · 30%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "Oud, saffron and resin — the souk an hour after sundown.",
    notes: {
      top: ["Cardamom", "Pink Pepper"],
      heart: ["Saffron", "Jasmine Sambac"],
      base: ["Oud", "Labdanum", "Ambroxan"],
    },
    theme: {
      accent: "#D8A24A",
      accentSoft: "#F0D6A0",
      aura: "#5A2E12",
      shape: "faceted",
      glass: "rgba(255, 226, 178, 0.10)",
      juice: ["#C97B32", "#8A4118", "#3E1608"],
      fill: 0.7,
      cap: { c1: "#F6DFA6", c2: "#C9963E", c3: "#7A5416", texture: "knurl", w: 52, h: 30, r: 5 },
      collar: { c1: "#EBCB86", c2: "#8C6520" },
      label: { style: "foil", ink: "#3A1F08", plate: "#D9B368" },
    },
  },
  {
    id: "golden-resin-amber",
    name: "Golden Resin",
    collection: "Amber",
    concentration: "Eau de Parfum · 22%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "Benzoin and frankincense melted into honey and left in the sun.",
    notes: {
      top: ["Orange Peel", "Frankincense"],
      heart: ["Benzoin", "Coumarin"],
      base: ["Labdanum", "Vanillin"],
    },
    theme: {
      accent: "#E9B255",
      accentSoft: "#FBE3B0",
      aura: "#6A3D12",
      shape: "orb",
      glass: "rgba(255, 236, 198, 0.12)",
      juice: ["#F2C56A", "#D48D2A", "#8C4E10"],
      fill: 0.74,
      cap: { c1: "#FBE7B4", c2: "#D6A445", c3: "#8A611D", texture: "facets", w: 46, h: 26, r: 12 },
      collar: { c1: "#F2D79A", c2: "#96702A" },
      label: { style: "etched", ink: "#4A2A0C", plate: "rgba(250,243,229,0.9)" },
    },
  },
  {
    id: "smoke-over-the-souk",
    name: "Smoke Over the Souk",
    collection: "Arabic Mukhallat",
    concentration: "Extrait · 28%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "Guaiac smoke drifting over cypriol and cold incense.",
    notes: {
      top: ["Black Pepper", "Cypriol"],
      heart: ["Frankincense", "Safraleine"],
      base: ["Guaiacol", "Oud", "Labdanum"],
    },
    theme: {
      accent: "#A98C74",
      accentSoft: "#E0CDB9",
      aura: "#2A1D16",
      shape: "obelisk",
      glass: "rgba(226, 214, 202, 0.08)",
      juice: ["#5C4436", "#2E1E16", "#120A06"],
      fill: 0.66,
      cap: { c1: "#6E6058", c2: "#332B26", c3: "#14100D", texture: "none", w: 54, h: 22, r: 3 },
      collar: { c1: "#B9A99A", c2: "#4A3F36" },
      label: { style: "plate", ink: "#E7D9C7", plate: "rgba(18,12,8,0.82)" },
    },
  },
  {
    id: "rose-oud-attar",
    name: "Rose Oud Attar",
    collection: "Floral Mukhallat",
    concentration: "Attar · 100%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "Damask rose laid over oud in a bed of jojoba.",
    notes: {
      top: ["Rose Petal", "Litchi"],
      heart: ["Phenyl Ethyl Alcohol", "PEME"],
      base: ["Oud", "Labdanum", "Civet"],
    },
    theme: {
      accent: "#D2786C",
      accentSoft: "#F4C6BC",
      aura: "#5C2028",
      shape: "teardrop",
      glass: "rgba(255, 219, 219, 0.10)",
      juice: ["#D9727F", "#A33C4C", "#571825"],
      fill: 0.72,
      cap: { c1: "#F7CFC0", c2: "#C88A72", c3: "#7E4634", texture: "facets", w: 44, h: 28, r: 8 },
      collar: { c1: "#EFC3AE", c2: "#8E5843" },
      label: { style: "foil", ink: "#4A141F", plate: "#E3A995" },
    },
  },
  {
    id: "classic-bergamot-cologne",
    name: "Bergamot Cologne",
    collection: "Citrus",
    concentration: "Eau de Cologne · 12%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "Cold bergamot and petitgrain, poured straight over ice.",
    notes: {
      top: ["Bergamot", "Petitgrain"],
      heart: ["Linalool", "Hedione"],
      base: ["Dihydromyrcenol", "Iso E Super"],
    },
    theme: {
      accent: "#D9D45E",
      accentSoft: "#F2F0B8",
      aura: "#3C4A1E",
      shape: "cylinder",
      glass: "rgba(228, 255, 232, 0.12)",
      juice: ["#EDEB96", "#C8CE58", "#8A9430"],
      fill: 0.78,
      cap: { c1: "#EDF0F2", c2: "#A9B2B8", c3: "#5E686E", texture: "knurl", w: 40, h: 24, r: 4 },
      collar: { c1: "#DCE3E7", c2: "#6C767C" },
      label: { style: "etched", ink: "#3F4413", plate: "rgba(252,251,240,0.9)" },
    },
  },
  {
    id: "iso-e-space-wood",
    name: "Space Wood",
    collection: "Woody",
    concentration: "Eau de Parfum · 20%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "Vetiver roots and cedar suspended in weightless amber-wood.",
    notes: {
      top: ["Pink Pepper", "Clary Sage"],
      heart: ["Cedarwood", "Vetiver"],
      base: ["Iso E Super", "Vertofix"],
    },
    theme: {
      accent: "#9AAA84",
      accentSoft: "#DCE6CC",
      aura: "#2F3A26",
      shape: "flask",
      glass: "rgba(226, 240, 218, 0.10)",
      juice: ["#A8A06A", "#6E6A3E", "#33301B"],
      fill: 0.68,
      cap: { c1: "#8A6A46", c2: "#5A4028", c3: "#2E1F13", texture: "grain", w: 44, h: 34, r: 4 },
      collar: { c1: "#C9CBB4", c2: "#585C46" },
      label: { style: "plate", ink: "#E9F0DC", plate: "rgba(24,28,16,0.82)" },
    },
  },
  {
    id: "skin-musk-halo",
    name: "Skin Musk Halo",
    collection: "Foundational",
    concentration: "Eau de Parfum · 18%",
    size: "100 ml",
    price: "₹1,000",
    tagline: "The invisible one. Reads as skin, never as perfume.",
    notes: {
      top: ["Aldehyde C-12", "Hedione"],
      heart: ["Galaxolide", "Cashmeran"],
      base: ["Ambroxan", "Exaltolide"],
    },
    theme: {
      accent: "#E4CFB4",
      accentSoft: "#F8EEDF",
      aura: "#4A3A2C",
      shape: "flacon",
      glass: "rgba(255, 248, 236, 0.13)",
      juice: ["#F6EBD9", "#E0CBAC", "#B99B76"],
      fill: 0.62,
      cap: { c1: "#FBF3E6", c2: "#DCC7AA", c3: "#9C866B", texture: "none", w: 48, h: 26, r: 10 },
      collar: { c1: "#F0E2CC", c2: "#8C7B64" },
      label: { style: "etched", ink: "#5A452C", plate: "rgba(252,246,236,0.9)" },
    },
  },
];

export default PERFUMES;
