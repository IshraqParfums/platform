import type { BespokeAxis } from '../types.js';

export const AXIS_TO_CATEGORY: Record<BespokeAxis, string> = {
  citrus: 'Citrus',
  green: 'Top Note',
  aquatic: 'Aqua / Fresh',
  floral: 'Floral',
  woody: 'Woody',
  amber: 'Amber',
  gourmand: 'Gourmand',
  spicy: 'Spicy',
  powdery: 'Nostalgic',
  musk: 'Foundational',
  smoky: 'Arabic Mukhallat',
};

export const NAME_WORDS: Record<
  BespokeAxis,
  { adj: string[]; noun: string[] }
> = {
  citrus: { adj: ['Sunlit', 'Bright', 'Zesty'], noun: ['Zest', 'Sunrise', 'Spark'] },
  green: { adj: ['Verdant', 'Fresh-Cut', 'Dewy'], noun: ['Leaf', 'Meadow', 'Garden'] },
  aquatic: { adj: ['Misty', 'Cool', 'Coastal'], noun: ['Tide', 'Breeze', 'Rain'] },
  floral: { adj: ['Blooming', 'Velvet', 'Petal'], noun: ['Bloom', 'Petal', 'Garden'] },
  woody: { adj: ['Golden', 'Quiet', 'Rooted'], noun: ['Wood', 'Grove', 'Timber'] },
  amber: { adj: ['Golden', 'Warm', 'Radiant'], noun: ['Amber', 'Glow', 'Sunset'] },
  gourmand: { adj: ['Warm', 'Honeyed', 'Sweet'], noun: ['Vanilla', 'Honey', 'Sugar'] },
  spicy: { adj: ['Spiced', 'Ember', 'Bold'], noun: ['Ember', 'Spice Trail', 'Flame'] },
  powdery: { adj: ['Soft', 'Vintage', 'Tender'], noun: ['Powder', 'Memory', 'Veil'] },
  musk: { adj: ['Bare', 'Quiet', 'Intimate'], noun: ['Skin', 'Whisper', 'Hush'] },
  smoky: { adj: ['Smoky', 'Dusky', 'Mysterious'], noun: ['Ember', 'Shadow', 'Smoke'] },
};

export const AXIS_DESC: Record<BespokeAxis, string> = {
  citrus: 'bright, sun-lit citrus',
  green: 'crisp, garden-fresh green',
  aquatic: 'cool, airy freshness',
  floral: 'soft, radiant florals',
  woody: 'warm, grounded wood',
  amber: 'golden, honeyed amber',
  gourmand: 'sweet, comforting warmth',
  spicy: 'lively, warming spice',
  powdery: 'soft, nostalgic powder',
  musk: 'quiet, skin-close sensuality',
  smoky: 'smoky, mysterious depth',
};

export const WHY: Record<BespokeAxis, string> = {
  citrus:
    "You're drawn to brightness and energy — citrus gives any blend an instant lift.",
  green:
    'You love the feeling of nature up close — green notes bring that realism in.',
  aquatic:
    'Clean, fresh air is your happy place — aquatic notes capture exactly that.',
  floral:
    "Flowers speak to your romantic side — they're the heart of almost every great perfume.",
  woody:
    'You\'re grounded and understated — wood gives a fragrance quiet, lasting depth.',
  amber:
    'You gravitate toward warmth and comfort — amber is the coziest note in perfumery.',
  gourmand:
    'You have a sweet tooth, and it shows — gourmand notes add real warmth and comfort.',
  spicy: 'You like a little excitement — spice gives a fragrance real personality.',
  powdery:
    "You're drawn to soft, nostalgic comfort — powdery notes feel like a warm memory.",
  musk:
    'You prefer something intimate and close to skin — musk is quietly magnetic.',
  smoky:
    "You're drawn to a little mystery — smoky notes add intrigue and depth.",
};
