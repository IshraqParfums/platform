/**
 * Perfume spray slider — framework-agnostic core.
 *
 * Owns the DOM, the drag/snap physics and the spray choreography. It has no
 * dependency on React or Next; the React wrapper in ../PerfumeSlider.tsx just
 * mounts it into a ref and forwards callbacks.
 *
 *   const slider = createPerfumeSlider(el, { perfumes, onChange });
 *   slider.next(); slider.spray(); slider.destroy();
 */

import { renderBottle, renderLabel } from "./bottle.js";
import { SprayEngine } from "./spray.js";
import { GlassSurface } from "./glass/surface.js";
import { tierColor, totalHoursOf } from "./pyramid.js";
import { ScentTrail } from "./trail.js";
import { clamp, esc, rand } from "./util.js";

let instances = 0;

/**
 * Two curves, because the two ways of turning the table start differently.
 *
 * `glide` is for a press — a button, a key, a tick. The table is at rest, so it
 * has to get going as well as stop, and a curve that starts at full speed reads
 * as a jolt.
 *
 * `settle` is for letting go of a drag. The table is already moving at the
 * hand's speed, so easing in again would stall it before it carried on.
 */
const glide = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const settle = (t) => 1 - Math.pow(1 - t, 3);

/**
 * How long an ingredient stays on the glass, relative to a plain droplet.
 *
 * This is the fragrance pyramid, applied literally: top notes are the volatile
 * ones and flash off first, the heart holds the middle, and base notes are
 * heavy, low-volatility materials that cling long after the rest has gone.
 */
const NOTE_PERSISTENCE = { top: 0.45, heart: 1, base: 2.4 };

/** Top, heart and base — how many presses make a whole wear. */
const TIER_COUNT = 3;

/**
 * @param {HTMLElement} root
 * @param {object} options
 * @param {import('./index.js').Perfume[]} options.perfumes  The collection. Required.
 * @param {number} [options.index]          Starting slide.
 * @param {-1|0|1} [options.facing]         Which way the bottle points: -1 left,
 *   0 at the viewer, 1 right. Default 0, so a spray lands on the glass in front
 *   of you rather than off to the side.
 * @param {boolean} [options.sprayOnLoad]   Fire once on arrival. Default false.
 * @param {boolean} [options.sprayOnChange] Fire when the active perfume changes.
 *   Default false: nothing sprays unless somebody asks it to.
 * @param {boolean} [options.sprayOnSlide]  Small puff as each bottle passes the
 *   front while being dragged. Default true — this one answers a gesture rather
 *   than happening on its own.
 * @param {boolean} [options.autoplay]      Advance on a timer. Default false.
 * @param {number} [options.autoplayDelay]  Milliseconds between advances. Default 5200.
 * @param {(perfume, index) => void} [options.onChange]
 * @param {(perfume, index) => void} [options.onSpray]
 * @param {(perfume, index) => void} [options.onSelect] Fired by the CTA button.
 */
export function createPerfumeSlider(root, options = {}) {
  const opts = {
    index: 0,
    facing: 0,
    sprayOnLoad: false,
    sprayOnChange: false,
    sprayOnSlide: true,
    autoplay: false,
    autoplayDelay: 5200,
    // What you are wearing, pinned to the bottom of the screen. Only a
    // deliberate application puts anything there — the small puffs bottles
    // give off while the table is being dragged do not count as putting a
    // perfume on, and a tray that appeared every time one went past would be
    // unusable.
    trail: true,
    onChange: null,
    onSpray: null,
    onSelect: null,
    ...options,
  };

  // The core carries no collection of its own — the data lives in
  // web/data/perfumes.json and is handed in by whoever mounts the slider.
  if (!Array.isArray(opts.perfumes) || opts.perfumes.length === 0) {
    throw new Error("createPerfumeSlider: `perfumes` must be a non-empty array.");
  }

  const uid = `ipx${++instances}`;
  let perfumes = opts.perfumes.slice();
  let index = clamp(opts.index, 0, perfumes.length - 1);
  let pos = index; // fractional position on the ring, drives the transforms
  let slideW = 260; // hand travel per bottle
  let radiusX = 220; // half-width of the table
  let radiusY = 24; // and how much of its depth we can see
  let destroyed = false;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ DOM */

  root.classList.add("ipx-slider");
  root.setAttribute("tabindex", "0");
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", "Perfume collection");

  root.innerHTML = `
    <div class="ipx-aura" aria-hidden="true"></div>
    <div class="ipx-vignette" aria-hidden="true"></div>

    <header class="ipx-head">
      <span class="ipx-eyebrow">Ishraq Parfums · The Collection</span>
      <!-- Said up front, not in the small print. Everything here — the mist,
           the hours, the layers wearing off — is modelled, and somebody about
           to trust a number about how long a perfume lasts should know that
           before they read the number rather than after. -->
      <span class="ipx-sim"><i class="ipx-sim-dot" aria-hidden="true"></i>Olfactory simulation</span>
      <p class="ipx-hint">Drag through the collection. Turn a bottle toward you and the spray lands on the glass — wipe it off. Mukhallats are oils, applied with the rod.</p>
    </header>

    <div class="ipx-stage">
      <div class="ipx-table" aria-hidden="true">
        <span class="ipx-table-cast"></span>
        <span class="ipx-table-edge"></span>
        <span class="ipx-table-top"></span>
        <span class="ipx-table-rim"></span>
      </div>
      <div class="ipx-rail"></div>
      <button class="ipx-nav ipx-prev" type="button" aria-label="Previous perfume">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="ipx-nav ipx-next" type="button" aria-label="Next perfume">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <!-- Built once and updated in place. Re-rendering it on every change blew
         the whole block away and replayed its entrance animation, which read
         as the caption blinking out and coming back each time you turned the
         table. -->
    <div class="ipx-info" aria-live="polite">
      <div class="ipx-info-in">
        <span class="ipx-collection"></span>
        <h3 class="ipx-name"></h3>
        <p class="ipx-tagline"></p>
        <dl class="ipx-notes">
          <div class="ipx-note-row"><dt>top</dt><dd data-note="top"></dd></div>
          <div class="ipx-note-row"><dt>heart</dt><dd data-note="heart"></dd></div>
          <div class="ipx-note-row"><dt>base</dt><dd data-note="base"></dd></div>
        </dl>
        <div class="ipx-meta">
          <span class="ipx-conc"></span>
          <span class="ipx-dot"></span>
          <span class="ipx-price"></span>
        </div>
        <div class="ipx-actions">
          <button class="ipx-btn ipx-btn-ghost ipx-spray-btn" type="button"></button>
          <button class="ipx-btn ipx-btn-solid ipx-cta" type="button">Discover</button>
        </div>
        <!-- What to do, and then what you are looking at. It lives here rather
             than in the tray because the reassurance about the clock needs room
             to be a sentence, and the tray has to stay thin. -->
        <p class="ipx-wear-hint" aria-live="polite"></p>
      </div>
    </div>

    <div class="ipx-scrub">
      <div class="ipx-track" role="tablist" aria-label="Choose a perfume"></div>
      <div class="ipx-aim" role="group" aria-label="Turn the bottle">
        <span class="ipx-aim-label">Aim</span>
        <button class="ipx-aim-btn" type="button" data-facing="-1" aria-pressed="false"
                title="Turn left">&#8592;</button>
        <button class="ipx-aim-btn ipx-aim-you" type="button" data-facing="0" aria-pressed="false"
                title="Turn toward you">At you</button>
        <button class="ipx-aim-btn" type="button" data-facing="1" aria-pressed="false"
                title="Turn right">&#8594;</button>
      </div>
    </div>

    <canvas class="ipx-canvas" aria-hidden="true"></canvas>
    <div class="ipx-notes-layer" aria-hidden="true"></div>
    <canvas class="ipx-glass" aria-hidden="true"></canvas>
    <div class="ipx-rod-tip" aria-hidden="true"></div>
  `;

  const stage = root.querySelector(".ipx-stage");
  const rail = root.querySelector(".ipx-rail");
  const canvas = root.querySelector(".ipx-canvas");
  const notesLayer = root.querySelector(".ipx-notes-layer");
  const info = root.querySelector(".ipx-info");
  const track = root.querySelector(".ipx-track");
  const glass = root.querySelector(".ipx-glass");
  const aim = root.querySelector(".ipx-aim");
  const rodTip = root.querySelector(".ipx-rod-tip");
  const tableEl = root.querySelector(".ipx-table");

  const engine = new SprayEngine(canvas);
  const screen = new GlassSurface(glass);
  // Fixed to the viewport, so it is mounted on the body rather than inside the
  // slider — it outlives the part of the page you happen to be looking at.
  const trail = opts.trail ? new ScentTrail() : null;
  let settleTimer = 0;
  /** Set once a wear has run its course, so the caption can say what it did. */
  let wornOut = false;
  /** Set when a press landed on a wear that was already complete. */
  let toppedUp = false;
  if (trail) {
    trail.onDone = () => {
      wornOut = true;
      toppedUp = false;
      root.classList.remove("ipx-wearing");
      renderWearHint();
    };
  }

  /**
   * Put a perfume on.
   *
   * Nothing scrolls. There was a scroll here that nudged the page up so the
   * caption cleared the tray, from when the tray was the only place the new
   * layer could be read — it was worth moving the page to see it. It is not
   * any more: the tray is fixed, the layers are always on screen, and the
   * spacer leaves room to reach the controls whenever somebody wants them.
   * Moving the page under a finger that just pressed a button, to solve a
   * problem that no longer exists, is the page taking a liberty.
   */
  function wear(p, i = index) {
    if (!trail) return;
    const before = trail.count;
    const tier = trail.apply(p);
    // Pressing a wear that was already whole tops it up rather than adding to
    // it, and the caption has to say so or the press looks like it did nothing.
    toppedUp = before >= TIER_COUNT;
    root.classList.add("ipx-wearing");

    // Send the mist down to the strip it is about to become. Waits for the
    // tray, because before that the strip has no position on screen to aim at
    // and the motes would fall to nowhere. From the nozzle rather than the
    // middle of the screen: the point is that this layer is made of what just
    // left that bottle.
    if (tier) {
      const from = nozzleAt(i, null);
      // A wear that has just been topped up is not one that has run out.
      wornOut = false;
      renderWearHint();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => !destroyed && trail.settle(from), 620);
    }
  }

  // Wet glass gets its own cursor, so it is clear the drag will wipe rather
  // than browse.
  screen.onWetChange = (wet) => root.classList.toggle("ipx-wet", wet);

  /**
   * Which way the atomiser points: -1 left, 0 at the viewer, 1 right.
   *
   * At the viewer by default. The mist is the thing worth looking at, and
   * pointed sideways it is a plume seen edge-on; pointed at you it arrives on
   * the glass, where you can read the notes off it and wipe it away.
   */
  let facing = clamp(opts.facing, -1, 1);

  /* -------------------------------------------------------------- rendering */

  /**
   * The markup for one bottle — reflection, the bottle itself, and its label.
   * Split out of buildSlides() because it is the expensive part (a full SVG
   * with its own gradients and filter, times two for the reflection) and it
   * no longer runs for every perfume up front — see hydrate() below.
   */
  function slideInnerHTML(p, i) {
    return `<svg class="ipx-reflection" viewBox="0 0 220 340" aria-hidden="true"
               xmlns="http://www.w3.org/2000/svg"><use href="#bottle-${uid}-${i}"/></svg>${renderBottle(
                 p,
                 `${uid}-${i}`,
               )}${renderLabel(p)}`;
  }

  /**
   * Which slides actually carry their bottle markup right now.
   *
   * buildSlides() used to render every perfume's bottle — two SVGs, several
   * gradients and a filter each — into the DOM on mount, and layout() walked
   * all of them on every drag and wheel tick. That was fine at the size this
   * was built for (a few dozen perfumes; see the "forty-seven" note on
   * RING_SPAN), but at hundreds it meant hundreds of live bottle SVGs sitting
   * in the tree for one that shows ~11 at a time, and it made scrolling and
   * dragging genuinely sluggish — this is what fixes that.
   *
   * layout() already computes, every time it runs, exactly which slides are
   * visible enough to matter (the HIDE_BELOW cutoff below). Reusing that
   * check to fill a slide's bottle markup in on the frame it first crosses
   * that line — rather than for all of them up front — means only the
   * bottles anyone could actually see ever cost anything.
   */
  const hydrated = new Set();

  function hydrate(i, slide) {
    if (hydrated.has(i)) return;
    hydrated.add(i);
    const bottle = slide.querySelector(".ipx-bottle");
    if (bottle) bottle.innerHTML = slideInnerHTML(perfumes[i], i);
  }

  function buildSlides() {
    hydrated.clear();
    rail.innerHTML = perfumes
      .map(
        (p, i) => `
      <div class="ipx-slide" data-i="${i}" role="group" aria-roledescription="slide"
           aria-label="${esc(p.name)}, ${i + 1} of ${perfumes.length}">
        <div class="ipx-bottle"></div>
      </div>`,
      )
      .join("");

    track.innerHTML = perfumes
      .map(
        (p, i) => `
      <button class="ipx-tick" type="button" role="tab" data-i="${i}"
              aria-label="${esc(p.name)}" aria-selected="${i === index}">
        <span class="ipx-tick-line"></span>
      </button>`,
      )
      .join("");
  }

  /** Cached so the caption can be written to without being rebuilt. */
  const parts = {
    collection: info.querySelector(".ipx-collection"),
    name: info.querySelector(".ipx-name"),
    tagline: info.querySelector(".ipx-tagline"),
    conc: info.querySelector(".ipx-conc"),
    price: info.querySelector(".ipx-price"),
    apply: info.querySelector(".ipx-spray-btn"),
    wearHint: info.querySelector(".ipx-wear-hint"),
    notes: {
      top: info.querySelector('[data-note="top"]'),
      heart: info.querySelector('[data-note="heart"]'),
      base: info.querySelector('[data-note="base"]'),
    },
  };

  /**
   * Write the caption for the current perfume.
   *
   * Text only — the elements are never replaced. Nothing here is interpolated
   * into markup either, so there is no escaping to get wrong.
   */
  function renderInfo() {
    const p = perfumes[index];
    parts.collection.textContent = p.collection;
    parts.name.textContent = p.name;
    parts.tagline.textContent = p.tagline;
    parts.conc.textContent = p.concentration;
    parts.price.textContent = `${p.price} · ${p.size}`;
    parts.apply.textContent = p.application === "rod" ? "Apply it" : "Spray it";
    renderWearHint();
    for (const role of ["top", "heart", "base"]) {
      parts.notes[role].textContent = p.notes[role].join(" · ");
    }
  }

  /**
   * What to do, and then what you are looking at.
   *
   * Two jobs, in order. Before anything is on, it asks for the three presses —
   * without which nobody would know there was a wear to watch at all, because
   * one press only lays a base. After the third it explains the clock, and
   * that is the important half.
   *
   * A number running from zero to twelve hours in forty seconds can be read
   * exactly the wrong way: as a perfume disappearing while you watch. It is a
   * time-lapse of a very long wear, and saying so turns the same animation from
   * "this is going" into "this is how long this lasts". Nothing about the model
   * changed; the sentence in front of it did.
   */
  function renderWearHint() {
    if (!parts.wearHint) return;
    const p = perfumes[index];
    const rod = p && p.application === "rod";
    const on = trail ? trail.count : 0;
    if (on < TIER_COUNT) {
      wornOut = false;
      toppedUp = false;
    }
    const hours = p ? totalHoursOf(p) : 0;
    const verb = rod ? "Touch it on" : "Spray it";

    parts.wearHint.textContent =
      on === 0
        ? `${verb} three times — base, heart and top — to watch how long it lasts.`
        : on === 1
          ? "Base is down. Twice more for the heart and the top."
          : on === 2
            ? "Heart is on. Once more for the top notes."
            : toppedUp
              ? `Topped up — all three back to full, and the ${hours} hours start again.`
              : wornOut
                ? `${hours} hours on skin, start to finish — and the base was still there at the end.`
                : `All three on. Now watch ${hours} hours of wear play out in about half a minute.`;
  }

  function applyTheme() {
    const p = perfumes[index];
    const t = p.theme;
    root.style.setProperty("--ipx-accent", t.accent);
    root.style.setProperty("--ipx-accent-soft", t.accentSoft);
    root.style.setProperty("--ipx-aura", t.aura);
    // The air around the bottle, painted in what the perfume smells like.
    // Three washes, one per tier, in the same colours the layers are drawn in
    // — so the atmosphere the bottle is standing in is a picture of the thing
    // inside it rather than a tint chosen to flatter the glass.
    for (const tier of ["top", "heart", "base"]) {
      root.style.setProperty(`--ipx-scent-${tier}`, tierColor(t, tier));
    }
  }

  /**
   * The collection stands on a round table and you turn the table.
   *
   * Every bottle sits at its own angle around a circle, evenly spaced, and the
   * whole ring rotates under a fixed viewpoint. The one nearest you is front,
   * centre and full size; the rest fall away around the sides, getting smaller,
   * dimmer and softer as they go, and the far ones sit higher because that is
   * where the back of a table is. Since the ring closes, there is no end to
   * reach — turning past the last bottle brings the first one round again.
   *
   * @param {number} d Slides away from front, already wrapped to ±half a turn.
   * @returns {{x: number, y: number, depth: number}} depth: 1 nearest, -1 far.
   */
  function seat(d) {
    const th = d * step();
    // Past half a turn a bottle is behind the viewpoint. A collection longer
    // than the visible arc has bottles that far out, and without this they wrap
    // back round the front and the ring reads as two of everything.
    if (Math.abs(th) >= Math.PI) return { x: 0, y: -2 * radiusY, depth: -1 };
    const depth = Math.cos(th);
    return {
      x: Math.sin(th) * radiusX,
      // The far side of a table is further up the picture, not further down.
      y: -(1 - depth) * radiusY,
      depth,
    };
  }

  /**
   * How many bottles you can see round the near side of the table.
   *
   * Spacing them as `2π / length` puts the whole collection on one turn, which
   * is right up to about a dozen and falls apart after that: at forty-seven the
   * step is under eight degrees, neighbours overlap almost completely, and the
   * depth cue that makes it read as a table disappears into a wall of glass.
   *
   * So past this many the table gets bigger rather than the bottles closer —
   * the step stays put, the ring runs on behind you, and turning it brings the
   * rest round. Under it, `step()` is exactly `2π / length` as before.
   */
  const RING_SPAN = 11;

  /** Angle between neighbouring bottles, in radians. */
  function step() {
    return (Math.PI * 2) / Math.max(Math.min(perfumes.length, RING_SPAN), 2);
  }

  /** Shortest way round the ring, in slides. */
  function ringDelta(d) {
    const n = perfumes.length;
    const m = ((d % n) + n) % n;
    return m > n / 2 ? m - n : m;
  }

  let lastPos = pos;
  let lastLayout = 0;
  let slosh = 0;

  /**
   * How far the liquid is thrown by the table turning, in degrees.
   *
   * Taken from the ring's speed rather than its acceleration: acceleration is
   * the honest quantity but it is far too noisy read off pointer events, and
   * the spring on the way back to level — see .ipx-juice — supplies the part
   * that actually reads as slop. Sideways travel is what tips it, so it scales
   * with depth: the bottle at the front is moving across your view, the ones
   * at the sides are mostly moving away from you and barely stir.
   */
  function sloshOf(depth) {
    const now = performance.now();
    const dt = Math.min(now - lastLayout, 120);
    if (dt > 0) {
      // Bottles travel right as `pos` falls, and liquid piles up behind them.
      const v = ((pos - lastPos) / dt) * -1000;
      slosh = clamp(v * 1.9, -11, 11);
      lastPos = pos;
      lastLayout = now;
    }
    return slosh * depth;
  }

  /**
   * Write a style property only if it has actually changed.
   *
   * layout() runs on every frame of every turn, for every bottle. Assigning a
   * style invalidates the element whether or not the value differs, and each
   * of these elements is a full bottle SVG with a mirrored copy of itself
   * underneath — so the ones that are barely moving were being re-rastered for
   * nothing. The last value written is kept on the element.
   */
  function put(el, prop, value) {
    const last = el._ipx || (el._ipx = {});
    if (last[prop] === value) return;
    last[prop] = value;
    if (value === null) el.style.removeProperty(prop);
    else el.style.setProperty(prop, value);
  }

  /**
   * Beyond this far round the table a bottle is under 6% opaque and behind
   * whatever is in front of it. Taking it out of the render entirely is worth
   * more than any amount of tuning the things that are still visible.
   */
  const HIDE_BELOW = 0.05;

  /** Position every slide from the fractional `pos`. */
  function layout() {
    const slides = rail.children;
    const tilt = sloshOf(1);
    for (let i = 0; i < slides.length; i++) {
      const s = seat(ringDelta(i - pos));
      // 0 at the far side of the table, 1 at the front.
      const t = (s.depth + 1) / 2;
      const scale = 0.3 + 0.7 * Math.pow(t, 1.35);
      const opacity = 0.06 + 0.94 * Math.pow(t, 2.1);
      /**
       * Blur is by far the most expensive thing on this frame, and it costs in
       * proportion to the area blurred — so the bottles it is cheapest to skip
       * are exactly the ones that need it least.
       *
       * Nothing in the front group gets any. They are the large ones, they are
       * near enough to be in focus anyway, and a ~1px blur on a full-size
       * bottle was buying nothing for most of the cost. Behind that it comes in
       * quickly, and the radius is quantised: a fresh radius every frame is a
       * fresh rasterisation every frame, whereas in quarter-pixel steps most
       * frames reuse the last one and the eye cannot tell.
       */
      const blur = t > 0.6 ? 0 : Math.round((1 - t) * 5.2 * 4) / 4;

      const el = slides[i];

      // Round the far side of the table and invisible: stop drawing it at all.
      if (t < HIDE_BELOW) {
        put(el, "visibility", "hidden");
        put(el, "pointer-events", "none");
        continue;
      }
      if (!hydrated.has(i)) hydrate(i, el);
      put(el, "visibility", null);

      // Deliberately a 2D transform. A 3D one (translate3d/perspective/rotateY)
      // promotes each slide to its own compositing layer, where Chromium keeps
      // a stale raster of the bottle's SVG label text after the slide moves —
      // the plate and rules repaint, the glyphs don't. The round-table read
      // comes from the seat geometry, scale, blur and opacity instead.
      put(
        el,
        "transform",
        `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) scale(${scale.toFixed(3)})`,
      );
      put(el, "opacity", opacity.toFixed(3));
      // Drop the property entirely on the front slide rather than setting
      // `none`: an always-present filter promotes the slide to its own layer,
      // where SVG label text can fail to repaint after a transform.
      put(el, "filter", blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : null);
      put(el, "z-index", String(Math.round(t * 200)));
      put(el, "--ipx-slosh", `${(tilt * s.depth).toFixed(2)}deg`);
      // A reflection is a second, blurred, masked copy of the bottle. Round the
      // back it lands on a part of the table that is already in shadow and
      // under everything in front of it — invisible, and the most expensive
      // invisible thing on the page.
      put(el, "--ipx-refl", t > 0.55 ? "visible" : "hidden");

      const front = Math.abs(ringDelta(i - pos)) < 0.5;
      put(el, "pointer-events", front ? "auto" : "none");
      if (el.getAttribute("aria-hidden") !== String(!front)) {
        el.setAttribute("aria-hidden", String(!front));
      }
    }

    // Anything on the glass came off one of these bottles, and has to travel
    // with it as the table turns.
    screen.setAnchor(seat(ringDelta(screen.owner - pos)).x);
  }

  /**
   * Hand the glass to a bottle, and say where that bottle is standing.
   *
   * Has to happen before anything lands, not after. Particles record the anchor
   * at the moment they are created, and the anchor on the glass is still the
   * previous owner's until this runs — so a spray fired without it pins its
   * drops to whichever bottle sprayed last, and they travel with the wrong one.
   */
  function ownGlass(i) {
    screen.owner = i;
    screen.setAnchor(seat(ringDelta(i - pos)).x);
  }

  function measure() {
    const w = stage.clientWidth || 640;
    const h = stage.clientHeight || 420;
    radiusX = clamp(w * 0.31, 130, 330);
    // Shallow: the table is seen from just above its edge, so its circle
    // flattens. Any deeper and the ring reads as a wheel standing on end
    // rather than as a surface you are looking across.
    radiusY = clamp(h * 0.085, 16, 52);
    // How far the hand has to travel to turn the table by one bottle.
    slideW = clamp(w * 0.34, 150, 300);
    engine.resize();
    screen.resize();
    layout();
    drawTable();
  }

  /**
   * Fit the table to the ring standing on it.
   *
   * The bottles' feet trace the seat ellipse — semi-axes radiusX and radiusY,
   * with the front one at the near rim — so the table is drawn to exactly that
   * ellipse plus a margin. Any other proportion and it stops being the surface
   * they are standing on and becomes a shape they happen to be standing in
   * front of, which is what a guessed aspect-ratio gives you.
   */
  function drawTable() {
    const front = rail.children[index]?.querySelector(".ipx-bottle-svg");
    if (!front) return;

    const sr = stage.getBoundingClientRect();
    const br = front.getBoundingClientRect();
    if (!sr.height || !br.height) return;

    // Where the nearest bottle stands, and how wide a bottle is at full size.
    const footY = br.bottom - sr.top;
    const bottleW = br.width;

    // Scale every slide about its own foot rather than its middle. The seat
    // geometry places feet on the ellipse, but a transform scaled about the
    // centre lifts the foot as the bottle shrinks — so the ones at the sides
    // ended up hovering above the table instead of standing on it.
    rail.style.setProperty("--ipx-foot", `${footY.toFixed(1)}px`);

    // Wide enough to carry the ring standing on it, but never so wide that
    // both ends leave the frame: past that the ellipse loses its curve and the
    // table reads as a bar. Narrow screens hit this, where the bottles are
    // large relative to the space they sit in.
    const semiX = Math.min(radiusX + bottleW * 0.62, sr.width * 0.58);
    const semiY = radiusY * 1.15;

    tableEl.style.width = `${(semiX * 2).toFixed(0)}px`;
    tableEl.style.height = `${(semiY * 2).toFixed(0)}px`;
    // Centred on the ring, so the near rim falls just past the front foot.
    tableEl.style.top = `${(footY - radiusY - semiY).toFixed(0)}px`;
    // How deep the slab is. Tied to the table's own foreshortening: a top seen
    // this flat belongs to a piece of furniture whose edge you see this much
    // of, and a thickness picked independently reads as a disc with a band
    // painted under it.
    tableEl.style.setProperty("--ipx-thick", `${(radiusY * 1.25).toFixed(0)}px`);
  }

  /* ------------------------------------------------------------------ spray */

  /**
   * Where the mist leaves the bottle, relative to `target`'s box.
   * Reads the anchor inside whichever nozzle is currently shown, so turning
   * the bottle moves the spray origin with it.
   */
  function nozzleAt(i, target = canvas) {
    const slide = rail.children[i];
    if (!slide) return null;

    const group = perfumes[i] && perfumes[i].application === "rod"
      ? slide.querySelector(".ipx-rod")
      : slide.querySelector(facing === 0 ? ".ipx-nozzle-front" : ".ipx-nozzle-side");
    // The rod's tip is where an attar leaves the bottle, and it carries no
    // nozzle anchor of its own — fall back to the group's own box, which is
    // the wand, so the origin is still the thing the liquid came off.
    const anchor = (group && group.querySelector(".ipx-nozzle-anchor")) || group;
    if (!anchor) return null;

    const a = anchor.getBoundingClientRect();
    if (!a.width && !a.height) return null;
    // A null target means viewport coordinates, for anything living outside
    // the slider's own canvases — the trail is fixed to the screen.
    const c = target ? target.getBoundingClientRect() : { left: 0, top: 0 };
    return { x: a.left + a.width / 2 - c.left, y: a.top + a.height / 2 - c.top };
  }

  function floatNotes(i, origin, dir = 1) {
    const p = perfumes[i];
    const pool = [...p.notes.top, ...p.notes.heart];
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, 2);

    picks.forEach((note, n) => {
      const el = document.createElement("span");
      el.className = "ipx-note-float";
      el.textContent = note;
      el.style.left = `${origin.x + (8 + n * 12) * dir}px`;
      el.style.top = `${origin.y - 4 - n * 34}px`;
      // Fan the words apart so two notes never land on top of each other.
      el.style.setProperty("--ipx-note-dx", `${(58 + n * 30) * dir}px`);
      el.style.setProperty("--ipx-note-dy", `${-84 - n * 38}px`);
      el.style.animationDelay = `${n * 190}ms`;
      notesLayer.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    });
  }

  /** Every note, carrying how long its material lingers. */
  function volatileNotes(p) {
    return ["top", "heart", "base"].flatMap((role) =>
      p.notes[role].map((name) => ({ name, persistence: NOTE_PERSISTENCE[role] })),
    );
  }

  /**
   * Names a droplet where it landed.
   *
   * The label outlives its droplet, and deliberately so. Tied strictly to the
   * liquid, a volatile top note came and went inside a second — accurate, and
   * far too quick to read. Scent outlasts the drop it arrived in, so the name
   * is held past the point where the liquid has gone, with a floor beneath it
   * that guarantees every note is legible. The ordering the pyramid gives is
   * what carries the idea, not the absolute timings, and that survives.
   */
  function dropNote(note, x, y, r, ms) {
    const el = document.createElement("span");
    el.className = "ipx-drop-note";
    el.textContent = note;
    el.style.left = `${x + r + 6}px`;
    el.style.top = `${y - 7}px`;
    el.style.animationDuration = `${Math.round(clamp(ms * 1.4, 2400, 11000))}ms`;
    notesLayer.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  let firingTimer = null;
  let applyTimer = null;
  /** True while the wand is out of the bottle and following the pointer. */
  let rodArmed = false;

  /**
   * Fire the atomiser on a slide.
   * @param {number} [i]      Slide to act on. Defaults to the active one.
   * @param {number} [power]  0–1. Detent puffs use less than a full press.
   */
  function spray(i = index, power = 1) {
    const p = perfumes[i];
    const slide = rail.children[i];
    if (!p || !slide) return;

    if (p.application === "rod") {
      // Nothing happens on arrival. An attar is applied by hand, so the only
      // thing that marks the glass is you picking the rod up and drawing with
      // it — arriving used to lay a stroke down for you, which meant lines
      // appearing on their own, and appearing again every time the bottle came
      // back round.
      if (opts.onSpray) opts.onSpray(p, i);
      return;
    }

    slide.classList.remove("ipx-firing");
    void slide.offsetWidth; // restart the press animation
    slide.classList.add("ipx-firing");
    clearTimeout(firingTimer);
    firingTimer = setTimeout(() => slide.classList.remove("ipx-firing"), 460);

    root.classList.remove("ipx-pulse");
    void root.offsetWidth;
    root.classList.add("ipx-pulse");

    if (!reduced) {
      if (facing === 0) {
        // Pointed at the viewer: there is no cone to see side-on, so the mist
        // arrives on the glass in front of them instead.
        const hit = nozzleAt(i, glass);
        if (hit) {
          ownGlass(i);
          screen.spray({
            owner: i,
            x: hit.x,
            y: hit.y,
            color: p.theme.accent,
            colorSoft: p.theme.accentSoft,
            power,
            // A bottle turning past the front is not spraying at you. Its
            // puff still lands and still looks like liquid, but it does not
            // claim the drag — otherwise turning the table wets the glass,
            // and a wet glass turns the next drag into a wipe, so dragging
            // switches dragging off. See Droplets#isWetAt.
            passive: power <= 0.8,
            notes: power > 0.8 ? volatileNotes(p) : [],
            onLabel: dropNote,
          });
        }
      } else {
        const origin = nozzleAt(i);
        if (origin) {
          engine.spray({
            x: origin.x,
            y: origin.y,
            color: p.theme.accent,
            colorSoft: p.theme.accentSoft,
            // Mirrored when the bottle is turned to face left.
            angle: facing === -1 ? Math.PI + 0.16 : -0.16,
            power,
          });
          if (power > 0.8) floatNotes(i, origin, facing);
        }
      }
    }

    if (power > 0.8) wear(p, i);
    if (opts.onSpray) opts.onSpray(p, i);
  }

  /**
   * Arm the rod: draw it out of the bottle and keep it out.
   *
   * An attar is not fired at anything — it is drawn on. So applying is a
   * gesture, not a button press: the wand comes out, follows the pointer, and
   * lays a line of oil wherever it is dragged. It goes back when the stroke
   * ends.
   */
  function armRod() {
    const p = perfumes[index];
    const slide = rail.children[index];
    if (!p || !slide || p.application !== "rod") return;

    rodArmed = true;
    slide.classList.add("ipx-rod-out");
    root.classList.add("ipx-armed");
    rodTip.style.opacity = "1";

    clearTimeout(applyTimer);
    // Nobody leaves a rod out forever.
    applyTimer = setTimeout(() => !destroyed && disarmRod(), 9000);
    wear(p);
    if (opts.onSpray) opts.onSpray(p, index);
  }

  function disarmRod() {
    rodArmed = false;
    screen.oilEnd();
    root.classList.remove("ipx-armed");
    rodTip.style.opacity = "0";
    for (const slide of rail.children) slide.classList.remove("ipx-rod-out");
    clearTimeout(applyTimer);
  }

  /** The rod tip rides with the pointer while it is out. */
  function moveRodTip(e) {
    const c = glass.getBoundingClientRect();
    rodTip.style.transform = `translate(${e.clientX - c.left}px, ${e.clientY - c.top}px)`;
  }

  /**
   * Turn the bottle. -1 left, 0 toward the viewer, 1 right.
   * @param {number} next
   * @param {boolean} [spraying] Fire once turned, so the change is legible.
   */
  function setFacing(next, spraying = true) {
    facing = next;

    root.classList.toggle("ipx-face-left", facing === -1);
    root.classList.toggle("ipx-face-front", facing === 0);
    root.classList.toggle("ipx-face-right", facing === 1);

    for (const btn of aim.querySelectorAll(".ipx-aim-btn")) {
      btn.setAttribute("aria-pressed", String(Number(btn.dataset.facing) === facing));
    }

    // Mist and note words from the old direction would hang in the wrong place.
    engine.clear();
    screen.clear();
    notesLayer.replaceChildren();
    if (spraying) setTimeout(() => !destroyed && spray(index, 1), 220);
  }

  /* --------------------------------------------------------------- movement */

  let tween = null;

  function animateTo(target, duration = 620, ease = glide) {
    if (tween) cancelAnimationFrame(tween.raf);
    const from = pos;
    const delta = target - from;
    if (Math.abs(delta) < 0.0005) {
      pos = target;
      layout();
      return;
    }

    // Turning two seats takes longer than one, but not twice as long — the
    // table has momentum. Without this a wrap across the ring either crawls or
    // whips past, depending on which single duration you picked.
    const ms = duration * Math.min(1.75, Math.pow(Math.abs(delta), 0.55));

    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / ms, 0, 1);
      pos = from + delta * ease(t);
      layout();
      if (t < 1) {
        tween.raf = requestAnimationFrame(step);
      } else {
        tween = null;
        // Land exactly, so the seat maths does not carry a rounding error
        // around the ring forever.
        pos = target;
        layout();
      }
    };
    tween = { raf: requestAnimationFrame(step) };
  }

  /** Bring a bottle to the front, turning whichever way is shorter. */
  function setIndex(next, { animate = true, spraying = true, ease = glide } = {}) {
    const n = perfumes.length;
    // The ring has no ends, so this wraps rather than clamps — past the last
    // bottle is the first one again.
    const wrapped = ((Math.round(next) % n) + n) % n;
    const changed = wrapped !== index;
    index = wrapped;

    applyTheme();
    renderInfo();
    for (const tick of track.children) {
      tick.setAttribute("aria-selected", String(Number(tick.dataset.i) === index));
    }
    for (const slide of rail.children) {
      slide.classList.toggle("ipx-active", Number(slide.dataset.i) === index);
    }
    // Nothing to aim on a bottle that does not spray.
    root.classList.toggle("ipx-rod", perfumes[index].application === "rod");
    if (rodArmed) disarmRod();

    // `pos` runs free rather than being pinned to 0..n-1, so the ring can be
    // turned round and round. The target is the nearest seat that puts this
    // bottle at the front, which is what stops a wrap spinning the long way.
    const target = pos + ringDelta(wrapped - pos);
    if (animate) animateTo(target, reduced ? 0 : 620, ease);
    else {
      pos = target;
      layout();
    }

    if (changed && opts.onChange) opts.onChange(perfumes[index], index);
    if (spraying && opts.sprayOnChange) {
      // Let the bottle arrive before it fires.
      setTimeout(() => !destroyed && spray(index, 1), reduced ? 0 : 210);
    }
  }

  const next = () => setIndex(index + 1);
  const prev = () => setIndex(index - 1);

  /* ---------------------------------------------------------------- gestures */

  let drag = null;
  let lastDetent = index;
  /** What the current press is for: "wipe", "drag", or null when idle. */
  let gesture = null;

  /**
   * Press with the rod out: this lays down oil, and nothing else.
   *
   * Bound to the root rather than the stage, because the wand follows the
   * pointer across the whole slider and has to be able to draw everywhere it
   * can reach. On the stage alone it tracked your hand over the caption and
   * then did nothing when you pressed there.
   */
  function onRodDown(e) {
    if (!rodArmed) return;
    if (e.button != null && e.button > 0) return;
    if (e.target.closest("button")) return;

    gesture = "apply";
    const c = glass.getBoundingClientRect();
    const p = perfumes[index];
    ownGlass(index);
    screen.oilBegin({
      owner: index,
      color: p.theme.accent,
      colorSoft: p.theme.accentSoft,
      width: rand(27, 37),
    });
    screen.oilTo(e.clientX - c.left, e.clientY - c.top);
    // On the root, so the stroke survives the pointer leaving the stage.
    root.setPointerCapture?.(e.pointerId);
  }

  function onRodUp() {
    if (gesture !== "apply") return;
    gesture = null;
    // One stroke per draw: the wand goes back in the bottle.
    disarmRod();
  }

  function onPointerDown(e) {
    if (rodArmed) return; // onRodDown owns this press
    if (e.button != null && e.button > 0) return;
    if (e.target.closest("button")) return;

    // A press does one job or the other, decided here and held for the whole
    // gesture. Press on a wet patch and the drag wipes, with the carousel
    // staying put; press on clear glass and it moves the collection. Letting
    // it do both meant one swipe wiped the screen and changed the perfume at
    // the same time, spraying on the way.
    //
    // The test is local on purpose. Asking whether there is liquid anywhere
    // never comes back false — a wipe sheds fresh drops of its own — and the
    // collection would become undraggable.
    const c = glass.getBoundingClientRect();

    if (screen.isWetAt(e.clientX - c.left, e.clientY - c.top)) {
      gesture = "wipe";
      screen.endWipe();
      stage.setPointerCapture?.(e.pointerId);
      return;
    }

    gesture = "drag";
    stopAutoplay();
    if (tween) cancelAnimationFrame(tween.raf);
    tween = null;

    drag = {
      id: e.pointerId,
      x: e.clientX,
      startPos: pos,
      last: e.clientX,
      v: 0,
      time: performance.now(),
      moved: false,
    };
    lastDetent = Math.round(pos);
    stage.setPointerCapture?.(e.pointerId);
    root.classList.add("ipx-dragging");
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;

    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 3) drag.moved = true;

    const now = performance.now();
    const dt = Math.max(now - drag.time, 1);
    drag.v = (e.clientX - drag.last) / dt;
    drag.last = e.clientX;
    drag.time = now;

    // No rubber band and no ends: the table just keeps turning.
    pos = drag.startPos - dx / slideW;
    layout();

    // Puff at each detent as it passes — "sprays as you slide".
    const detent = Math.round(pos);
    if (detent !== lastDetent) {
      lastDetent = detent;
      if (opts.sprayOnSlide) {
        spray(((detent % perfumes.length) + perfumes.length) % perfumes.length, 0.5);
      }
    }
  }

  function onPointerUp(e) {
    if (gesture === "apply") return; // onRodUp owns this release
    if (gesture === "wipe") {
      gesture = null;
      screen.endWipe();
      return;
    }
    gesture = null;
    if (!drag || e.pointerId !== drag.id) return;
    const flick = drag.v;
    const wasDrag = drag.moved;
    drag = null;
    root.classList.remove("ipx-dragging");

    if (!wasDrag) return;

    // A quick flick carries to the neighbouring slide.
    let target = Math.round(pos);
    if (Math.abs(flick) > 0.45) target = flick < 0 ? Math.ceil(pos) : Math.floor(pos);

    setIndex(target, { animate: true, spraying: true, ease: settle });
  }

  /**
   * Wiping is passive: it follows the pointer wherever it goes over the
   * slider, hover or drag. It deliberately consumes no events, so it never
   * competes with dragging the carousel — and dragging on to the next perfume
   * happens to clean the glass on the way, which is what you would do anyway.
   */
  function onPointerWipe(e) {
    if (rodArmed) {
      moveRodTip(e);
      if (gesture === "apply") {
        const c = glass.getBoundingClientRect();
        screen.oilTo(e.clientX - c.left, e.clientY - c.top);
      }
      return; // the rod is out; it draws, it does not wipe
    }
    // Hovering wipes, and so does a gesture that committed to wiping. A drag
    // that committed to moving the collection does not.
    if (gesture === "drag") return;
    if (!screen.hasLiquid()) return;
    const c = glass.getBoundingClientRect();
    screen.wipe(e.clientX - c.left, e.clientY - c.top);
  }

  const onPointerLeave = () => {
    screen.endWipe();
    // A stroke in progress keeps the rod out even if the hand wanders off the
    // slider; putting the wand away mid-line would cut it short.
    if (rodArmed && gesture !== "apply") disarmRod();
  };

  let wheelLock = false;
  function onWheel(e) {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!dx) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => (wheelLock = false), 420);
    if (dx > 0) next();
    else prev();
  }

  function onKeyDown(e) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        stopAutoplay();
        next();
        break;
      case "ArrowLeft":
        e.preventDefault();
        stopAutoplay();
        prev();
        break;
      case "Home":
        e.preventDefault();
        setIndex(0);
        break;
      case "End":
        e.preventDefault();
        setIndex(perfumes.length - 1);
        break;
      case "[":
        e.preventDefault();
        setFacing(Math.max(facing - 1, -1));
        break;
      case "]":
        e.preventDefault();
        setFacing(Math.min(facing + 1, 1));
        break;
      case " ":
      case "Enter":
        if (e.target === root) {
          e.preventDefault();
          spray(index, 1);
        }
        break;
    }
  }

  function onClick(e) {
    const tick = e.target.closest(".ipx-tick");
    if (tick) {
      stopAutoplay();
      setIndex(Number(tick.dataset.i));
      return;
    }
    if (e.target.closest(".ipx-prev")) {
      stopAutoplay();
      prev();
      return;
    }
    if (e.target.closest(".ipx-next")) {
      stopAutoplay();
      next();
      return;
    }
    const aimBtn = e.target.closest(".ipx-aim-btn");
    if (aimBtn) {
      stopAutoplay();
      setFacing(Number(aimBtn.dataset.facing));
      return;
    }
    if (e.target.closest(".ipx-spray-btn")) {
      if (perfumes[index].application === "rod") return armRod();
      return spray(index, 1);
    }
    if (e.target.closest(".ipx-cta")) {
      if (opts.onSelect) opts.onSelect(perfumes[index], index);
      return;
    }
    // Tapping the bottle itself presses the atomiser.
    if (e.target.closest(".ipx-slide.ipx-active")) spray(index, 1);
  }

  /* --------------------------------------------------------------- autoplay */

  let autoTimer = null;
  function startAutoplay() {
    if (!opts.autoplay || reduced) return;
    stopAutoplay();
    autoTimer = setInterval(() => {
      if (document.hidden) return;
      setIndex(index >= perfumes.length - 1 ? 0 : index + 1);
    }, opts.autoplayDelay);
  }
  function stopAutoplay() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  /* ----------------------------------------------------------------- wiring */

  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerUp);
  stage.addEventListener("wheel", onWheel, { passive: false });
  // The rod draws anywhere on the slider, so its press and release live on the
  // root. They run after the stage's, which bow out while the rod is armed.
  root.addEventListener("pointerdown", onRodDown);
  root.addEventListener("pointerup", onRodUp);
  root.addEventListener("pointercancel", onRodUp);
  root.addEventListener("pointermove", onPointerWipe, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("click", onClick);

  const ro = new ResizeObserver(measure);
  ro.observe(stage);
  // The glass layer spans the whole slider, not just the stage.
  const rootRo = new ResizeObserver(() => {
    engine.resize();
    screen.resize();
  });
  rootRo.observe(root);

  const onVisibility = () => {
    if (!document.hidden) return;
    engine.stop();
    screen.stop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  buildSlides();
  setIndex(index, { animate: false, spraying: false });
  // Put the bottle where `facing` says, without firing it, so the aim control
  // and the bottle agree from the first frame.
  setFacing(facing, false);
  measure();
  // Opening spray, once the layout has settled. Nothing fires on its own
  // unless it was asked to.
  const bootTimer = setTimeout(() => !destroyed && opts.sprayOnLoad && spray(index, 1), 520);
  startAutoplay();

  /* -------------------------------------------------------------------- API */

  return {
    get index() {
      return index;
    },
    get perfume() {
      return perfumes[index];
    },
    goTo: (i) => setIndex(i),
    next,
    prev,
    spray: (power = 1) => spray(index, power),
    get facing() {
      return facing;
    },
    /**
     * How far the liquid currently on the glass has been carried from the
     * centre, in pixels, as the table turns under it. Useful for keeping an
     * overlay of your own aligned with the drops.
     */
    get glassAnchor() {
      return screen.anchor;
    },
    /** Turn the bottle: -1 left, 0 toward the viewer, 1 right. */
    setFacing: (next, spraying = true) => setFacing(clamp(next, -1, 1), spraying),
    /** Swap the collection at runtime — e.g. once the API responds. */
    setPerfumes(list, keepIndex = true) {
      perfumes = list.slice();
      index = clamp(keepIndex ? index : 0, 0, perfumes.length - 1);
      buildSlides();
      setIndex(index, { animate: false, spraying: false });
      measure();
    },
    destroy() {
      destroyed = true;
      clearTimeout(bootTimer);
      clearTimeout(firingTimer);
      clearTimeout(settleTimer);
      stopAutoplay();
      if (tween) cancelAnimationFrame(tween.raf);
      ro.disconnect();
      rootRo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      stage.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onRodDown);
      root.removeEventListener("pointerup", onRodUp);
      root.removeEventListener("pointercancel", onRodUp);
      root.removeEventListener("pointermove", onPointerWipe);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("click", onClick);
      engine.destroy();
      screen.onWetChange = null;
      screen.destroy();
      // Mounted on the body, so it has to be taken down by hand — clearing
      // the slider's own markup would leave it stranded on the page.
      if (trail) trail.destroy();
      root.innerHTML = "";
      root.classList.remove("ipx-slider");
    },
  };
}

export default createPerfumeSlider;
