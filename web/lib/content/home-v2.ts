import type { ProductListItem } from "@ishraqparfums/shared";

export const HOME_HERO = {
  eyebrow: "Small-batch perfumery · Made in India",
  urdu: "خوشبو جو صرف تمہاری ہے",
  headline: ["A scent that’s", "unmistakably yours."],
  lead: "Composed from real perfumery materials, one question at a time.",
  primaryCta: { label: "Discover your scent", href: "#consultation" },
  secondaryCta: { label: "Explore the collection", href: "/shop" },
  image: {
    src: "/home/studio/hero-perfume-still.webp",
    alt: "Amber perfume bottle with oud wood and citrus peel",
  },
} as const;

export const HOME_MATERIALS = {
  urdu: "مواد جیسے وہ آتے ہیں",
  heading: "The materials, as they arrive.",
  items: [
    {
      id: "oud",
      name: "Oud",
      role: "Base",
      notes: "dark wood · resin · smoke",
      blurb:
        "The spine of our darker compositions. Aged wood and resin that hold a trail.",
      src: "/home/studio/specimen-oud.webp",
      alt: "Cutout of agarwood chips and dark resin",
      float: "a",
    },
    {
      id: "saffron",
      name: "Saffron",
      role: "Spark",
      notes: "warm spice · leather · mineral",
      blurb:
        "Heat and mineral lift. A thread of spice that wakes the skin.",
      src: "/home/studio/specimen-saffron.webp",
      alt: "Cutout of saffron threads in a small mound",
      float: "b",
    },
    {
      id: "rose",
      name: "Rose",
      role: "Heart",
      notes: "petal · stem · velvet",
      blurb:
        "Not a bouquet. Dried petal and stem, soft and slightly bitter.",
      src: "/home/studio/specimen-rose.webp",
      alt: "Cutout of a dried rose petal on a short stem",
      float: "c",
    },
    {
      id: "amber",
      name: "Amber",
      role: "Skin",
      notes: "resin · warmth · skin",
      blurb:
        "Warmth that stays close. Resin and citrus peel against the body.",
      src: "/home/studio/specimen-amber.webp",
      alt: "Cutout of amber resin with dried citrus peel",
      float: "d",
    },
  ],
} as const;

export interface ProductWorld {
  src: string;
  alt: string;
  /** `·`-separated note list. The collection card sets these as lines. */
  descriptors: string;
}

/** Visual world per known slug. Unknown products cycle the four stills. */
export const PRODUCT_WORLDS: Record<string, ProductWorld> = {
  "velvet-reserve": {
    src: "/home/studio/world-velvet.webp",
    alt: "Burgundy velvet in intimate shadow",
    descriptors: "soft textile · intimate shadow · skin",
  },
  "smoke-and-saffron": {
    src: "/home/studio/world-smoke.webp",
    alt: "Saffron threads, charred wood, and smoke",
    descriptors: "dry saffron · smoke · amber · skin",
  },
  "oud-ishraq": {
    src: "/home/studio/world-oud.webp",
    alt: "Agarwood chips and resin on stone",
    descriptors: "agarwood · resin · dark timber · earth",
  },
  "amber-meridian": {
    src: "/home/studio/world-amber.webp",
    alt: "Amber glass and citrus peel in afternoon light",
    descriptors: "warm stone · citrus peel · amber glass",
  },
};

const DIRECTED_SLUGS = [
  "velvet-reserve",
  "smoke-and-saffron",
  "oud-ishraq",
  "amber-meridian",
] as const;

const DIRECTED_SLUG_SET = new Set<string>(DIRECTED_SLUGS);

/** Prefer the four directed worlds; fill from the rest of the catalog. */
export function pickCollection(
  products: ProductListItem[],
  limit = 4,
): ProductListItem[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const preferred = DIRECTED_SLUGS.flatMap((slug) => {
    const product = bySlug.get(slug);
    return product ? [product] : [];
  });
  const rest = products.filter(
    (product) => !DIRECTED_SLUG_SET.has(product.slug),
  );
  return [...preferred, ...rest].slice(0, limit);
}

/**
 * Atmosphere still for a product — the collection card's image fallback and the
 * consultation's backdrop. Cycling is fine here: any of the four stills reads as
 * "a perfumer's table", so an undirected product borrowing one is not a claim
 * about that product. `notesForProduct` deliberately does not cycle.
 */
export function worldForProduct(
  product: ProductListItem,
  index: number,
): ProductWorld {
  const fallbacks = Object.values(PRODUCT_WORLDS);
  return (
    PRODUCT_WORLDS[product.slug] ??
    fallbacks[index % fallbacks.length] ??
    fallbacks[0]
  );
}

/**
 * The note lines under a collection card, split out of the authored descriptor
 * string. Strict by slug, unlike `worldForProduct`: a descriptor names actual
 * materials, so letting an undirected product cycle onto one would print
 * another perfume's notes under its name.
 */
export function notesForProduct(product: ProductListItem): string[] | null {
  const world = PRODUCT_WORLDS[product.slug];
  if (!world) return null;
  const notes = world.descriptors
    .split("·")
    .map((note) => note.trim())
    .filter(Boolean);
  return notes.length > 0 ? notes : null;
}

export const HOME_COLLECTION = {
  kicker: "The collection",
  heading: "Four perfumes, ready to wear.",
  lead: "Composed and bottled in small runs. Wear one as it is, or start from it.",
  notesLabel: "Notes",
  action: "View",
  soldOut: "Sold out",
  cta: { label: "View all perfumes", href: "/shop" },
  empty: "The collection is being bottled. Take the consultation in the meantime.",
} as const;

export const HOME_BESPOKE = {
  kicker: "A first question",
  heading: "Don’t choose a perfume. Find your scent.",
  lead:
    "Fifteen questions about mood and memory, none of them about perfume. A few minutes, no sign-up.",
  // Same three-step promise as the real /bespoke landing page (STEPS in
  // app/(shop)/bespoke/page.tsx), titles only — this card is a teaser, not a
  // second landing page, so it doesn't repeat that page's body copy.
  steps: [
    "Answer about fifteen questions",
    "We match your fingerprint",
    "Name it, save it, or buy it",
  ],
  card: {
    label: "Opening question",
    step: "1 of 15",
    progress: 1 / 15,
    // Mirrors the bespoke engine's real start node ("I-fluency"). Keep
    // option ids in sync with packages/bespoke-engine/data/questions.json if
    // that node's options ever change — these are submitted to the API
    // verbatim by /api/bespoke/quick-start.
    question:
      "Before we go further — how much do you want me to explain as we go?",
    options: [
      {
        id: "if-lover",
        label: "Just make me something beautiful. I don’t need the details.",
      },
      {
        id: "if-enthusiast",
        label: "I’m curious. Tell me what things are as you use them.",
      },
      { id: "if-perfumer", label: "Talk to me properly. I know my materials." },
    ],
  },
} as const;

export const HOME_BELIEF = {
  eyebrow: "Ishraq — radiance, dawn",
  urdu: "اشراق",
  statement:
    "A good perfume should feel like it was made for the person wearing it, not for a shelf.",
  body:
    "Ishraq is small-batch perfumery, composed and bottled in India. We work from a real palette of woods, resins, spices and flowers, in runs small enough that we still smell every one.",
  primaryCta: { label: "Browse the collection", href: "/shop" },
  secondaryCta: { label: "How bespoke works", href: "/bespoke" },
} as const;
