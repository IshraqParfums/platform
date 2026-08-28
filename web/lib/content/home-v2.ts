import type { ProductListItem } from "@ishraqparfums/shared";

/**
 * The Urdu line and the English headline are the same sentence, which is why
 * the hero sets them as a matched pair either side of a rule rather than
 * stacking a small Urdu label above an unrelated headline.
 *
 * No eyebrow. It used to carry "Small-batch perfumery · Made in India", which
 * pushed the hero to five stacked text elements and said nothing that Belief's
 * body copy at the foot of the page doesn't already say in a full sentence.
 */
export const HOME_HERO = {
  urdu: "خوشبو جو صرف تمہاری ہے",
  headline: ["A scent that’s", "unmistakably yours."],
  lead: "Composed from real perfumery materials, one question at a time.",
  primaryCta: { label: "Discover your scent", href: "#consultation" },
  secondaryCta: { label: "Explore the collection", href: "/shop" },
  image: {
    src: "/home/studio/hero-oud-smoke.webp",
    alt: "Smoky oud chips and incense on a dark studio table",
  },
} as const;

export const HOME_MATERIALS = {
  urdu: "مواد جیسے وہ آتے ہیں",
  heading: "The materials, as they arrive.",
  items: [
    {
      id: "sandalwood",
      name: "Sandalwood",
      role: "Base",
      notes: "cream wood · milk · dust",
      blurb:
        "The quiet wood that holds a composition together. Soft, milky, close to the skin.",
      src: "/home/studio/specimen-sandalwood.webp",
      alt: "Cutout of pale sandalwood chips and shavings",
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

const FEATURED_SLUGS = [
  "velvet-reserve",
  "smoke-and-saffron",
  "oud-ishraq",
  "amber-meridian",
] as const;

const FEATURED_SLUG_SET = new Set<string>(FEATURED_SLUGS);

/** Prefer four known bottles; fill from the rest of the catalog. */
export function pickCollection(
  products: ProductListItem[],
  limit = 4,
): ProductListItem[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const preferred = FEATURED_SLUGS.flatMap((slug) => {
    const product = bySlug.get(slug);
    return product ? [product] : [];
  });
  const rest = products.filter(
    (product) => !FEATURED_SLUG_SET.has(product.slug),
  );
  return [...preferred, ...rest].slice(0, limit);
}

export const HOME_COLLECTION = {
  kicker: "The collection",
  heading: "Four perfumes, ready to wear.",
  lead: "Composed and bottled in small runs. Wear one as it is, or start from it.",
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
