/**
 * A presentation-only grouping for B1 ("Some smells don't stay in the
 * nose... where does yours live?") — the one question in the graph with 91
 * options in a flat list. Nothing here touches routing: every option still
 * carries its own `next` in questions.json (91 distinct B2-* targets, one
 * per option), and picking an option through this two-step picker submits
 * the exact same `{ optionIds: [id] }` a flat list would have. This file
 * only decides which screen an option appears on, grouped by theme rather
 * than by scent family (BespokeDimension) — most of these 91 options carry
 * no `vector` of their own at all; the actual scent data lives further down
 * each option's own B2-* branch, so a family-based split wasn't available
 * to key off, and would have fought the question's own memory-first
 * framing anyway ("Rain" reads as a place before it reads as "green").
 *
 * Grouping and ordering only. If questions.json's B1 options ever change,
 * `bespoke-quiz-client.tsx`'s CategorizedSingleSelect folds anything not
 * listed here into a trailing "More" category rather than dropping it, so
 * this file going stale degrades to a slightly odd bucket, not a missing
 * option.
 */

export interface B1Category {
  id: string;
  label: string;
  optionIds: string[];
}

/** Always offered on its own, outside every category — the explicit "none
 *  of these speak to me" escape hatch, same role "Nothing is off-limits"
 *  plays on the veto question. */
export const B1_CATCHALL_OPTION_ID = "b1-indirect";

export const B1_CATEGORIES: B1Category[] = [
  {
    id: "weather",
    label: "Rain, Rivers & Weather",
    optionIds: [
      "b1-rain",
      "b1-river",
      "b1-sea",
      "b1-winter",
      "b1-fresh-aqua",
      "b1-monsooncourtyard",
      "b1-coastaldawn",
      "b1-saltmarsh",
      "b1-mittiyard",
      "b1-hillstation",
    ],
  },
  {
    id: "quiet-hours",
    label: "Quiet Hours",
    optionIds: [
      "b1-night",
      "b1-moonlitterrace",
      "b1-midnighttrain",
      "b1-emberwatch",
      "b1-readingroom",
      "b1-rooftop",
      "b1-cellardoor",
      "b1-coldstorage",
      "b1-sunroomglass",
    ],
  },
  {
    id: "food",
    label: "Kitchens & Spice",
    optionIds: [
      "b1-chai",
      "b1-coffee",
      "b1-kitchen",
      "b1-copperkitchen",
      "b1-fridayfeast",
      "b1-gourmand-ref",
      "b1-coffeehouse",
      "b1-cinnamonbakery",
      "b1-sugarrefinery",
      "b1-damaskpreserve",
      "b1-nutmeggalley",
    ],
  },
  {
    id: "gardens",
    label: "Gardens & Groves",
    optionIds: [
      "b1-garden",
      "b1-orchard",
      "b1-orchardbloom",
      "b1-orchardwindfall",
      "b1-gardenparty",
      "b1-autumnvineyard",
      "b1-grapearbour",
      "b1-lavenderfield",
      "b1-claryhillside",
      "b1-blackcurranthedge",
      "b1-kewragarden",
      "b1-ylangverandah",
      "b1-physicgarden",
      "b1-glasshouse",
      "b1-teaterrace",
    ],
  },
  {
    id: "workshops",
    label: "Workshops & Trades",
    optionIds: [
      "b1-tailor",
      "b1-pottery",
      "b1-atelier",
      "b1-violinworkshop",
      "b1-watchmakersbench",
      "b1-sandalcarver",
      "b1-tannery",
      "b1-brassfoundry",
      "b1-papermill",
      "b1-indigovats",
      "b1-linenpress",
      "b1-myrrhapothecary",
      "b1-balsamstore",
      "b1-coldsmokehouse",
      "b1-riversidelaundry",
      "b1-rosewaterstill",
    ],
  },
  {
    id: "journeys",
    label: "Journeys & Markets",
    optionIds: ["b1-road", "b1-silkroute", "b1-cargo", "b1-nightmarket", "b1-village"],
  },
  {
    id: "heritage",
    label: "Heritage & Story",
    optionIds: [
      "b1-palace",
      "b1-temple",
      "b1-mughal",
      "b1-indian-heritage",
      "b1-arabian-nights",
      "b1-mukhallat-ref",
      "b1-heirloom",
      "b1-signature",
      "b1-rosequarter",
      "b1-agarwoodcabinet",
      "b1-amberwoodnoon",
    ],
  },
  {
    id: "occasions",
    label: "Occasions",
    optionIds: ["b1-romance", "b1-wedding", "b1-bridalveil", "b1-stadium", "b1-cinema", "b1-velvetopera"],
  },
  {
    id: "rooms",
    label: "Rooms & Relics",
    optionIds: ["b1-library", "b1-treasure", "b1-ruins", "b1-coldchapel", "b1-barber", "b1-threshingfloor", "b1-winterhearth"],
  },
];
