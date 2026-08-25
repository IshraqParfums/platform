/**
 * Every fixed string on the v2 home page.
 *
 * Kept out of the components for one specific reason: the page carries two
 * languages, and the Urdu line and the English heading it sits above have to be
 * changed together or they drift apart. Reading them as adjacent fields makes
 * that obvious; hunting them across eight component files does not.
 *
 * The only text on the page that does NOT live here is the per-product Urdu
 * name, which is `Product.nameUrdu` and comes from the API.
 *
 * The Urdu below is placeholder-quality — it reads correctly but should be
 * reviewed by a native speaker before launch. Same caveat as the seed data.
 */

export interface BilingualHeading {
  /** Nastaliq line, set above the English. */
  urdu: string;
  english: string;
}

export const HOME_HERO = {
  urdu: "خوشبو جو صرف تمہاری ہے",
  headlineLead: "Perfume,",
  headlineEmphasis: "composed",
  headlineTail: "for you",
  lead:
    "Small-batch bottles from a real palette. Or fifteen questions, and we match one to you.",
  primaryCta: { label: "Shop the collection", href: "/shop" },
  secondaryCta: { label: "Find your blend", href: "/bespoke/quiz" },
} as const;

/** Unused: kept so `movements.tsx` still compiles as a rollback. */
export const HOME_MOVEMENTS = {
  eyebrow: "How it wears",
  heading: {
    urdu: "وقت کے ساتھ کھلتی ہے",
    english: "It arrives in three movements",
  } satisfies BilingualHeading,
  notes: [
    {
      key: "Top",
      title: "Saffron, bitter orange",
      body: "The first ten minutes. Bright, and gone before you notice.",
    },
    {
      key: "Heart",
      title: "Rose absolute, ember spice",
      body: "Where it settles. The part people recognise as you.",
    },
    {
      key: "Base",
      title: "Oud, labdanum, soft leather",
      body: "Still there on the shirt the next morning.",
    },
  ],
} as const;

export const HOME_MARKS = [
  {
    title: "Flat ₹50 shipping",
    body: "Anywhere in India. No surprises at checkout.",
  },
  {
    title: "Small-batch",
    body: "Composed and bottled in limited runs.",
  },
  {
    title: "Perfumer’s palette",
    body: "Real materials, not fragrance oils.",
  },
  {
    title: "Secure checkout",
    body: "UPI, cards, and net banking.",
  },
] as const;

export const HOME_SHELF = {
  heading: {
    urdu: "مجموعہ",
    english: "On the shelf",
  } satisfies BilingualHeading,
  action: { label: "View all", href: "/shop" },
  empty:
    "The shelf is being restocked. Take the quiz in the meantime. A bespoke blend is composed to order.",
} as const;

export const HOME_MOODS = {
  heading: {
    urdu: "مزاج",
    english: "Start with a mood",
  } satisfies BilingualHeading,
  empty: "Collections are being arranged. Browse the full shop in the meantime.",
} as const;

export const HOME_BESPOKE = {
  urdu: "خاص تمہارے لیے",
  headlineLead: "You can’t smell a screen.",
  headlineEmphasis: "So we ask instead.",
  lead:
    "Fifteen questions about mood and memory, none of them about perfume. A few minutes, no sign-up.",
  card: {
    label: "Opening question",
    step: "1 of 15",
    /** Drives the progress bar. One question of fifteen. */
    progress: 1 / 15,
    question: "When you walk into a room, how should this arrive with you?",
    answers: [
      "Warmth. Something people move closer to.",
      "Quiet. Only the people next to me.",
      "Presence. I want to be noticed when I enter.",
      "Soft. A trail that stays after I leave.",
    ],
    outcomeLabel: "What you leave with",
    outcome:
      "A 100 ml bottle matched to you, and a 2 ml vial of the other answer.",
    cta: { label: "Find your blend", href: "/bespoke/quiz" },
  },
} as const;

export const HOME_MATERIALS = {
  heading: "Drawn from the same stock",
} as const;

export const HOME_HOUSE = {
  urdu: "اشراق",
  statement:
    "A good perfume should feel like it was made for the person wearing it, not for a shelf.",
  body:
    "Everything is composed and bottled here in India, in batches small enough that we still smell every one. If none of it is quite you, the quiz exists for that.",
  primaryCta: { label: "Shop the collection", href: "/shop" },
  secondaryCta: { label: "How bespoke works", href: "/bespoke" },
} as const;
