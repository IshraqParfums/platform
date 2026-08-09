export { createPerfumeSlider } from "./slider.js";
export { renderBottle, renderLabel } from "./bottle.js";
export { SprayEngine } from "./spray.js";
export { Sparkles } from "./sparkle.js";

// How a perfume comes apart over time, with no opinion about how it is drawn.
// Shared by the React discover page and the standalone one, so the two cannot
// disagree about how long a heart note lasts.
export {
  TIERS,
  SHARE,
  RUN_MS,
  OPENING_HOLD_MS,
  TIER_LABEL,
  TIER_PHASE,
  TIER_BLURB,
  TIER_HANDOVER,
  enduranceLabel,
  tierHours,
  tierState,
  tierPresence,
  tierMix,
  tierRising,
  AMPLITUDE,
  formatHours,
  clockParts,
  formatClock,
  milestones,
  noteFade,
  tierColor,
  tierInk,
  TIER_TONE,
  KIND_HOLD,
  totalHoursOf,
} from "./pyramid.js";

// What lives on the glass, one part per behaviour. GlassSurface composes all
// three and is what the slider talks to; the parts are exported so they can be
// driven on their own.
export { GlassSurface } from "./glass/surface.js";
export { Droplets } from "./glass/droplets.js";
export { Oil } from "./glass/oil.js";
export { Wipe } from "./glass/wipe.js";
