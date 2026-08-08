/**
 * The drydown model.
 *
 * How a perfume comes apart over time, with no opinion about how it is drawn.
 * The React discover page and the standalone HTML both consume this, so the
 * two cannot disagree about how long a heart note lasts — which they would
 * within a week if each carried its own copy of the numbers.
 *
 * It sits beside the bottle renderer and the spray engine because it belongs to
 * the same family: plain modules, no framework, shared by everything that needs
 * to show a perfume.
 */

/**
 * Stacking order, bottom to top.
 *
 * A pyramid is built from its foundation, so the base is laid first and the top
 * notes go on last. That is the reverse of the order they are smelled in, and
 * the reverse of the order they leave in.
 */
export const TIERS = ["base", "heart", "top"];

/**
 * Share of the perfume's total life each tier survives.
 *
 * The same proportions the droplets on the glass evaporate by: top notes are
 * the volatile materials and flash off, base notes are heavy and cling. Held as
 * fractions rather than hours so they scale with whatever the perfume claims —
 * a four-hour cologne empties out three times faster than a twelve-hour attar
 * without any of these numbers changing.
 */
export const SHARE = { top: 0.12, heart: 0.45, base: 1 };

/** How long a full drydown takes on screen. Real hours are shown as text. */
export const RUN_MS = 42000;

export const TIER_LABEL = { top: "Top", heart: "Heart", base: "Base" };

/**
 * What each tier is called on a timeline, where it is a stretch of the wear
 * rather than a shelf in a pyramid.
 */
export const TIER_PHASE = { top: "Opening", heart: "Heart", base: "Trail" };

/**
 * All of this is written from what a perfume gives you, not what it loses.
 *
 * The physics is a decay curve and there is no getting round that — but decay
 * is the wrong story to tell somebody deciding what to buy. Nothing here is
 * dying: the opening is handing over to the heart, the heart to the trail, and
 * the trail is the thing that is still with you at midnight. Same curve, same
 * numbers, told forwards.
 *
 * And none of it waits its turn. All three are on the skin from the first
 * second, which is what these have to say — a top note is not the first act,
 * it is the loudest voice in a chord that is playing from the start.
 */
export const TIER_BLURB = {
  top: "On from the first second and the first to go quiet. It is what you smell when you lean in.",
  heart: "Under the opening from the start, and what is left standing once the bright things burn off.",
  base: "There from the first second and still there tomorrow. Everything else is sitting on top of it.",
};

/** What a tier hands over to when its stretch is done. */
export const TIER_HANDOVER = {
  top: "opened it up",
  heart: "carried the day",
  base: "stayed to the end",
};

/** Hours a tier holds on skin, for a perfume that lasts `totalHours`. */
export function tierHours(tier, totalHours) {
  return totalHours * SHARE[tier];
}

/** Hours as something readable: minutes under the hour, hours above it. */
export function formatHours(h) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toFixed(h < 3 ? 1 : 0)} h`;
}

/**
 * How loud each tier is in the opening.
 *
 * Everything is on the skin from the first second — the pyramid is not a queue.
 * What makes an opening smell like its top notes is that they are the loudest
 * thing there, not the only thing there, and the base is already underneath it
 * being quietly outshouted.
 */
export const AMPLITUDE = { top: 1, heart: 0.78, base: 0.58 };

/**
 * How many e-foldings a tier goes through over its stated life. At 3, a tier is
 * down to a twentieth of its opening strength by the hour it claims.
 */
const DECAY = 3;

/**
 * How much of a tier is still on the skin, `t` being 0–1 through the run.
 *
 * Plain exponential decay, running from the first moment for all three at once.
 * Nothing waits its turn and nothing switches off: they are all leaving from the
 * start, the top perhaps twenty times faster than the base, which is the whole
 * of what a drydown is.
 *
 * The model this replaced held each tier at full strength until it was two
 * thirds through its own life and then dropped it. That draws the pyramid as a
 * relay — top, hand over, heart, hand over, base — which is the version of
 * fragrance everybody has read and nobody has smelled.
 */
export function tierPresence(tier, t) {
  return Math.exp((-DECAY * Math.max(0, t)) / SHARE[tier]);
}

/**
 * What you are actually smelling right now, as a share per tier summing to 1.
 *
 * This is the number worth showing, and it is not the same as how much is left.
 * A base note barely changes over the first hour, but its share of the smell
 * climbs steeply — because the top is collapsing next to it. Nothing rises; the
 * thing above it falls, and what was always there comes forward. That is the
 * effect people describe as a perfume "opening up", and it comes out of the
 * arithmetic rather than having to be staged.
 *
 * @returns {Record<string, number>}
 */
export function tierMix(t) {
  const raw = {};
  let sum = 0;
  for (const tier of TIERS) {
    raw[tier] = AMPLITUDE[tier] * tierPresence(tier, t);
    sum += raw[tier];
  }
  const out = {};
  for (const tier of TIERS) out[tier] = sum > 0 ? raw[tier] / sum : 0;
  return out;
}

/**
 * Whether a tier is coming forward — its share of the smell still climbing.
 *
 * The moment to catch. A tier that is taking over is the most interesting thing
 * on the screen, and it happens without the tier itself doing anything.
 */
export function tierRising(tier, t, dt = 0.015) {
  const mix = tierMix(t);
  // The base's share climbs all the way to nearly the whole thing, so without a
  // ceiling it would announce itself as coming up for the last thirty seconds
  // of a run in which nothing is happening to it. Past this it has arrived.
  if (mix[tier] > 0.72) return false;
  return tierMix(Math.min(1, t + dt))[tier] > mix[tier] + 1e-5;
}

/**
 * A beat at the very start where nothing has moved yet.
 *
 * The top of a twelve-hour attar is an hour and a half, which is four seconds
 * of a forty-second run — so the one state this whole thing exists to show, all
 * three up together, was gone before the eye had found it. Held at zero for
 * long enough to read, and honest about what it is: the first moment, before
 * anything has had time to happen.
 */
export const OPENING_HOLD_MS = 1500;

/**
 * Where a tier has got to, kept in the shape the drawing code already expects.
 *
 * `left` is how much of it is on the skin, `gone` the inverse — which is what
 * noteFade wants for deciding which materials inside it have gone. `spent` is
 * a twentieth left, the point past which it is no longer really contributing.
 *
 * @returns {{gone: number, left: number, spent: boolean}}
 */
export function tierState(tier, t) {
  const left = tierPresence(tier, t);
  return { gone: 1 - left, left, spent: left <= 0.05 };
}

/**
 * Roughly how long a class of material hangs on, relative to the others.
 *
 * A proxy, and worth being honest about: volatility is a property of a specific
 * molecule, not of a category, and "molecule" covers both Ambroxan, which
 * outlasts almost anything, and dihydromyrcenol, which does not. What it gets
 * right is the part that matters here — resins and animalics are what
 * perfumers reach for to hold a composition down, and the light naturals are
 * what goes first. Ordering within a tier is all this is used for.
 */
export const KIND_HOLD = {
  natural: 1,
  accord: 1.05,
  molecule: 1.15,
  resin: 1.9,
  animalic: 2.1,
};

/**
 * How much of each material in a tier is still on the skin.
 *
 * A tier does not leave all at once. Inside the hour a top note lasts, the
 * citrus is gone long before the aldehyde, and watching a whole block dim in
 * step is the one thing about a fragrance pyramid that is plainly untrue. The
 * lightest material in the tier starts leaving first and the heaviest finishes
 * last, and their windows overlap by a wide margin so the tier thins as a wave
 * rather than emptying one chip at a time like a progress list.
 *
 * @param {string[]} kinds material kind per note, in listed order
 * @param {number} gone how far through this tier's own fade, 0–1
 * @returns {number[]} how much of each note is left, 0–1, in listed order
 */
export function noteFade(kinds, gone) {
  const n = kinds.length;
  if (!n) return [];
  const t = Math.min(1, Math.max(0, gone));
  // One material is the whole tier; it has nothing to go before or after.
  if (n === 1) return [1 - t];

  // Lightest first. Ties keep the order the perfumer listed them in, which is
  // the only signal left and is not a bad one.
  const order = kinds
    .map((k, i) => [KIND_HOLD[k] ?? 1, i])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Each note leaves over a window longer than the gap between turns, so the
  // whole tier is always mid-fade rather than handing over one at a time.
  const SPAN = 0.62;
  const left = new Array(n);
  order.forEach(([, idx], rank) => {
    const start = (rank / (n - 1)) * (1 - SPAN);
    left[idx] = 1 - Math.min(1, Math.max(0, (t - start) / SPAN));
  });
  return left;
}

/* ------------------------------------------------------------- tier colour
   Each tier gets its own pigment, taken from the perfume's own liquid.       */

/**
 * Which stop of the bottle's juice gradient each tier is pigmented from.
 *
 * The gradient already runs light at the top of the bottle to deep at the
 * bottom, which is the same order the pyramid runs in — volatile and bright at
 * the top, heavy and dark at the base. So the layers are coloured out of the
 * liquid you can see through the glass, rather than out of a palette invented
 * for the page.
 */
export const TIER_TONE = { top: 0, heart: 1, base: 2 };

/**
 * Where each tier's pigment is allowed to sit, as HSL lightness and a floor
 * under saturation.
 *
 * The raw juice cannot be used as-is: the base stop of a smoky attar is
 * #120A06, which on a dark page is a hole rather than a colour. Clamping into
 * three separate bands does two jobs at once — everything stays legible, and
 * the three layers stay told apart even when a perfume's gradient is three
 * shades of one brown.
 */
/**
 * The hue is nudged apart as well as the lightness.
 *
 * Plenty of perfumes have a gradient that is three shades of one colour — a
 * rose attar is pink at every stop — and three shades of one pink is not three
 * layers, it is one layer with a ramp on it. Turning the top a little warmer
 * and the base a little cooler separates them without leaving the family the
 * bottle belongs to, which is the line worth not crossing: these have to look
 * like this perfume, not like a chart.
 */
const TONE_BAND = {
  // The saturation floor climbs as the band lightens. A pale pigment laid over
  // a dark ground loses more of its colour than a deep one does, so leaving the
  // three on one floor made the top look dusty next to a vivid base — the same
  // paint, reading as three different amounts of paint.
  top: { l: [62, 80], s: 62, h: 16 },
  heart: { l: [50, 66], s: 54, h: 0 },
  base: { l: [40, 54], s: 50, h: -16 },
};

/** How much lighter type has to be than the powder it sits on to be read. */
const INK_FLOOR = 70;

/**
 * The room an authored scent colour is allowed. Wide on purpose — the point of
 * authoring it is that it is right, so this only catches a colour so dark it
 * would be a hole on the page or so pale it would be a glare.
 */
const SCENT_FLOOR = 30;
const INK_CEIL = 86;

function hexToRgb(hex) {
  const h = String(hex).replace("#", "").trim();
  const s = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = d / (l > 0.5 ? 2 - max - min : max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg];
  const hex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * The pigment for one tier of a given perfume.
 *
 * Hue comes from the bottle and is left alone — that is what makes a rose
 * attar's layers pink and a cologne's yellow-green. Only lightness and a floor
 * under saturation are imposed, so every layer reads on a dark ground and the
 * three of them are never the same colour.
 *
 * @param {object} theme a perfume's theme
 * @param {string} tier "top" | "heart" | "base"
 * @returns {string} a hex colour
 */
export function tierColor(theme, tier) {
  const i = TIER_TONE[tier];

  // An authored scent colour is the colour the tier brings to mind, read off
  // the materials in it — saffron and jasmine are a deep orange whatever the
  // liquid in the bottle looks like. It is already the answer, so nothing is
  // imposed on it but a floor and a ceiling that keep it readable on a dark
  // page. No hue rotation and no saturation forcing: those exist to pull three
  // stops of one brown apart, and a colour chosen on purpose does not need it.
  const painted = theme?.scent?.[i];
  if (painted) {
    const [h, s, l] = rgbToHsl(...hexToRgb(painted));
    return hslToHex(h, s, Math.min(INK_CEIL, Math.max(SCENT_FLOOR, l)));
  }

  // Otherwise fall back to the bottle's liquid, which is a picture of the
  // juice rather than of the smell, and needs the banding to be usable.
  const band = TONE_BAND[tier] ?? TONE_BAND.heart;
  const from = theme?.juice?.[i] ?? theme?.accent ?? "#C9963E";
  const [h, s, l] = rgbToHsl(...hexToRgb(from));
  return hslToHex(
    h + band.h,
    Math.min(92, Math.max(band.s, s)),
    Math.min(band.l[1], Math.max(band.l[0], l)),
  );
}

/**
 * The same pigment, lightened until it can be read as type.
 *
 * The tier's name is set in its own colour, which is the point — but the base's
 * pigment is a deep one and deep on top of deep is not a label, it is a rumour.
 * Same hue, same family, lifted until it carries on a dark ground.
 */
export function tierInk(theme, tier) {
  const [h, s, l] = rgbToHsl(...hexToRgb(tierColor(theme, tier)));
  return hslToHex(h, Math.min(90, s + 8), Math.max(INK_FLOOR, l));
}

/** The longevity a perfume claims, falling back to something unremarkable. */
export function totalHoursOf(perfume) {
  return perfume?.detail?.longevity?.hours?.[1] ?? 6;
}

/**
 * Elapsed time split into whole hours and the minutes left over.
 *
 * Given as parts rather than a string so a surface can set the numbers and
 * their units in different type — which is the only way to keep a big readout
 * scannable while still saying what the numbers are.
 *
 * @returns {{h: number, m: number}}
 */
export function clockParts(hours) {
  const mins = Math.max(0, Math.round(hours * 60));
  return { h: Math.floor(mins / 60), m: mins % 60 };
}

/**
 * Elapsed time as a labelled duration — 48m, 2h 48m, 9h.
 *
 * Deliberately not 2:48. A colon reads as the time of day, and this is a
 * duration: somebody glancing at "2:48" on a perfume page has to work out
 * whether it means nearly three hours or a quarter to three. The unit removes
 * the question. A whole hour drops the minutes rather than showing 9h 0m.
 */
export function formatClock(hours) {
  const { h, m } = clockParts(hours);
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Where each tier gives out, for marking up a timeline.
 *
 * Returned in the order they leave — which is the reverse of the order they
 * were stacked in, and the whole point of the picture.
 *
 * @param {number} totalHours
 * @returns {{tier: string, at: number, hours: number}[]} `at` is 0–1 along the run.
 */
export function milestones(totalHours) {
  return ["top", "heart", "base"].map((tier) => ({
    tier,
    at: SHARE[tier],
    hours: totalHours * SHARE[tier],
  }));
}

/**
 * A word for how long this lasts, from the perspective of wearing it.
 *
 * Deliberately generous where the hours earn it and honest where they do not:
 * a three-hour cologne is not a failure, it is a cologne, and saying so is
 * better for everyone than calling it "short" and leaving the buyer to feel
 * they are being sold something lesser.
 */
export function enduranceLabel(totalHours) {
  if (totalHours >= 10) return "All day and into the night";
  if (totalHours >= 8) return "A full day on skin";
  if (totalHours >= 6) return "Morning through evening";
  if (totalHours >= 4) return "A long afternoon";
  return "Bright and deliberately brief";
}
