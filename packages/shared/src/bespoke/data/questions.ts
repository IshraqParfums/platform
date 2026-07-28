import type {
  AxisFollowup,
  BespokeAxis,
  CoreQuestion,
  PrecisionQuestion,
} from '../types.js';

export const CORE_QUESTIONS: CoreQuestion[] = [
  {
    id: 1,
    text: 'How would you like your fragrance to feel overall?',
    options: [
      { label: 'Fresh & Clean', w: { aquatic: 3 } },
      { label: 'Warm & Cozy', w: { amber: 3 } },
      { label: 'Bold & Sensual', w: { musk: 3 } },
      { label: 'Soft & Romantic', w: { floral: 3 } },
      { label: 'Spiced & Exciting', w: { spicy: 3 } },
      { label: 'Dark & Mysterious', w: { smoky: 3 } },
    ],
  },
  {
    id: 2,
    text: "Pick the season that feels most 'you':",
    options: [
      { label: 'Spring', w: { floral: 3 } },
      { label: 'Summer', w: { citrus: 3 } },
      { label: 'Autumn', w: { spicy: 2, woody: 1 } },
      { label: 'Winter', w: { amber: 3 } },
      { label: 'Monsoon / rainy season', w: { aquatic: 3 } },
      { label: 'A misty autumn morning', w: { green: 2, powdery: 1 } },
    ],
  },
  {
    id: 3,
    text: 'Which of these smells makes you happiest?',
    options: [
      { label: 'Fresh citrus peel', w: { citrus: 3 } },
      { label: 'Blooming flowers', w: { floral: 3 } },
      { label: 'Warm vanilla or sweets', w: { gourmand: 3 } },
      { label: 'Fresh rain', w: { aquatic: 3 } },
      { label: 'Wood & spice market', w: { woody: 2, spicy: 1 } },
      { label: 'Old books and leather', w: { smoky: 2, powdery: 1 } },
    ],
  },
  {
    id: 4,
    text: "Pick a place you'd love to be right now:",
    options: [
      { label: 'A beach', w: { aquatic: 3 } },
      { label: 'A flower garden', w: { floral: 3 } },
      { label: 'A mountain forest', w: { woody: 3 } },
      { label: 'A spice bazaar', w: { spicy: 3 } },
      { label: 'A cozy cabin by a fire', w: { smoky: 2, woody: 1 } },
      { label: 'A grand old library', w: { powdery: 2, smoky: 1 } },
    ],
  },
  {
    id: 5,
    text: "Which fabric feels most like 'you'?",
    options: [
      { label: 'Crisp cotton', w: { aquatic: 3 } },
      { label: 'Soft cashmere', w: { powdery: 3 } },
      { label: 'Worn leather', w: { smoky: 3 } },
      { label: 'Silk', w: { floral: 2, musk: 1 } },
      { label: 'Denim', w: { woody: 2, green: 1 } },
      { label: 'Velvet', w: { musk: 2, floral: 1 } },
    ],
  },
  {
    id: 6,
    text: 'Pick a color that speaks to you:',
    options: [
      { label: 'White', w: { musk: 2, aquatic: 1 } },
      { label: 'Gold', w: { amber: 3 } },
      { label: 'Deep Red', w: { spicy: 2, musk: 1 } },
      { label: 'Green', w: { green: 3 } },
      { label: 'Black', w: { smoky: 3 } },
      { label: 'Blue', w: { aquatic: 2, green: 1 } },
    ],
  },
  {
    id: 7,
    text: 'Sweet tooth or savory?',
    options: [
      { label: 'Sweet tooth', w: { gourmand: 3 } },
      { label: 'Savory & spiced', w: { spicy: 3 } },
      { label: 'Bitter & dark (coffee, dark chocolate)', w: { woody: 2, smoky: 1 } },
      { label: 'Neither — I like fresh things', w: { aquatic: 2 } },
      { label: 'Tangy & citrusy', w: { citrus: 3 } },
    ],
  },
  {
    id: 8,
    text: 'Which weather do you love most?',
    options: [
      { label: 'A sunny hot day', w: { citrus: 3 } },
      { label: 'A rainy afternoon', w: { aquatic: 3 } },
      { label: 'A crisp cold morning', w: { woody: 2 } },
      { label: 'A golden autumn evening', w: { amber: 2, spicy: 1 } },
      { label: 'A misty, foggy morning', w: { green: 2, powdery: 1 } },
    ],
  },
  {
    id: 9,
    meta: 'intensity',
    text: 'How do you like to be noticed?',
    options: [
      { label: 'I prefer to be subtle', value: 'light' },
      { label: 'Somewhere in between', value: 'medium' },
      { label: 'I like a noticeable presence', value: 'medium' },
      { label: 'I want people to remember my scent', value: 'bold' },
      { label: 'I want it truly unforgettable', value: 'bold' },
    ],
  },
  {
    id: 10,
    meta: 'longevity',
    text: 'How long do you want your scent to last?',
    options: [
      { label: 'A light touch for a couple hours', value: 'short' },
      { label: 'I like to reapply through the day', value: 'short' },
      { label: 'All day, close to skin', value: 'medium' },
      { label: 'Long and noticeable', value: 'long' },
      { label: 'Long and powerful, no reapplying', value: 'long' },
    ],
  },
];

export const AXIS_FOLLOWUPS: Record<BespokeAxis, AxisFollowup> = {
  citrus: {
    text: "Within bright citrus, what's more you?",
    options: [
      { label: 'Sweet, juicy orange', material: 'Orange 10 Fold Oil' },
      { label: 'Classic sparkling bergamot', material: 'Bergamot' },
      { label: 'Dry, sophisticated citrus-leaf', material: 'Petitgrain Oil RC' },
    ],
  },
  green: {
    text: "Within fresh green, what's more you?",
    options: [
      { label: 'Crisp, just-cut grass', material: 'Cis-3-Hexenyl Acetate' },
      { label: 'Cool forest pine air', material: 'Pine Essential Oil' },
      { label: 'Boozy, herbal depth', material: 'Clary Sage Oil' },
    ],
  },
  aquatic: {
    text: "Within cool freshness, what's more you?",
    options: [
      { label: 'Watery, misty freshness', material: 'Floralozone' },
      { label: 'Just-showered clean', material: 'Dihydromercenol' },
      { label: 'Soft, airy freshness', material: 'Linalool' },
    ],
  },
  floral: {
    text: "Within soft florals, what's more you?",
    options: [
      { label: 'Heady white flowers', material: 'Jasmine Sambac' },
      { label: 'Soft, classic rose', material: 'Phenyl Ethyl Alcohol' },
      { label: 'Radiant, weightless petals', material: 'Hedione' },
      {
        label: 'Airy, transparent rose',
        material: 'PEME (Phenyl Ethyl Methyl Ether)',
      },
    ],
  },
  woody: {
    text: "Within warm wood, what's more you?",
    options: [
      { label: 'Dry, earthy roots', material: 'Vetiver EO' },
      { label: 'Soft, diffusive space', material: 'Iso E Super' },
      { label: 'Dark, earthy depth', material: 'Patchouli' },
      { label: 'Dense, classic wood', material: 'Vertofix' },
    ],
  },
  amber: {
    text: "Within golden amber, what's more you?",
    options: [
      { label: 'Honeyed & sweet', material: 'Labdanum Resinoid' },
      { label: 'Radiant & clean', material: 'Ambroxan 10%' },
      { label: 'Cool & resinous', material: 'Frankincense' },
      { label: 'Dry & modern', material: 'Sylvamber' },
    ],
  },
  gourmand: {
    text: "Within sweet warmth, what's more you?",
    options: [
      { label: 'Warm vanilla', material: 'Vanillin' },
      {
        label: 'Creamy, buttery softness',
        material: 'Gamma Nonalactone (Aldehyde C18)',
      },
      { label: 'Dark, roasted depth', material: 'Coffee CO2' },
      {
        label: 'Soft, peachy sweetness',
        material: 'Gamma Undecalactone (Aldehyde C14)',
      },
    ],
  },
  spicy: {
    text: "Within lively spice, what's more you?",
    options: [
      { label: 'Hot, sweet-spicy warmth', material: 'Cinnamon Bark Oil' },
      { label: 'Bright, fruity-fresh spice', material: 'Pinkpepper' },
      { label: 'Warm, bright spice', material: 'Cardamom Oil RCO' },
      { label: 'Dry, sharp pepper bite', material: 'Black Pepper Oil' },
    ],
  },
  powdery: {
    text: "Within soft, powdery comfort, what's more you?",
    options: [
      { label: 'Nostalgic violet-powder', material: 'Methyl Ionone Gamma' },
      { label: 'Soft powdery fixative', material: 'Benzyl Salicylate' },
      { label: 'Dry, sweet hay warmth', material: 'Coumarin' },
    ],
  },
  musk: {
    text: "Within quiet sensuality, what's more you?",
    options: [
      { label: 'Clean, soft skin-musk', material: 'Galaxolide' },
      { label: 'Cozy, spiced-sweater musk', material: 'Cashmeran' },
      { label: 'Warm, sensual skin depth', material: 'Civet' },
      { label: 'Soft, powdery musk', material: 'Exaltolide® Total' },
    ],
  },
  smoky: {
    text: "Within smoky depth, what's more you?",
    options: [
      { label: 'Leathery, spiced suede', material: 'Safraleine' },
      { label: 'Smoky, animalic oud', material: 'Oud Oliffac' },
      { label: 'A whisper of campfire smoke', material: 'Guaiacol' },
      { label: 'Dark, smoky-leathery wood', material: 'Nirlimbanol' },
    ],
  },
};

export const PRECISION_QUESTIONS: PrecisionQuestion[] = [
  {
    key: 'exclude',
    text: "Is there anything you'd rather avoid?",
    options: [
      { label: 'Nothing too sweet', exclude: 'gourmand' },
      { label: 'Nothing too smoky or animalic', exclude: 'smoky' },
      { label: 'Nothing too strong overall', forceLight: true },
      { label: "I'm open to anything", exclude: null },
    ],
  },
  {
    key: 'uniqueness',
    text: 'How unique do you want this to feel?',
    options: [
      { label: 'Classic & familiar', value: 'classic' },
      { label: 'A little unexpected', value: 'balanced' },
      { label: 'Truly one-of-a-kind', value: 'bold' },
    ],
  },
];
