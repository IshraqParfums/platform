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

import { PERFUMES } from "./perfume-data.js";
import { renderBottle, renderLabel } from "./bottle.js";
import { SprayEngine } from "./spray.js";

let instances = 0;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * @param {HTMLElement} root
 * @param {object} [options]
 * @param {import('./perfume-data.js').Perfume[]} [options.perfumes]
 * @param {number} [options.index]          Starting slide.
 * @param {boolean} [options.sprayOnChange] Spray when the active perfume changes. Default true.
 * @param {boolean} [options.autoplay]      Advance on a timer. Default false.
 * @param {number} [options.autoplayDelay]  Milliseconds between advances. Default 5200.
 * @param {(perfume, index) => void} [options.onChange]
 * @param {(perfume, index) => void} [options.onSpray]
 * @param {(perfume, index) => void} [options.onSelect] Fired by the CTA button.
 */
export function createPerfumeSlider(root, options = {}) {
  const opts = {
    perfumes: PERFUMES,
    index: 0,
    sprayOnChange: true,
    autoplay: false,
    autoplayDelay: 5200,
    onChange: null,
    onSpray: null,
    onSelect: null,
    ...options,
  };

  const uid = `ipx${++instances}`;
  let perfumes = opts.perfumes.slice();
  let index = clamp(opts.index, 0, perfumes.length - 1);
  let pos = index; // fractional position, drives the transforms
  let slideW = 260;
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
      <p class="ipx-hint">Drag to move through the collection — each one sprays as it arrives</p>
    </header>

    <div class="ipx-stage">
      <div class="ipx-rail"></div>
      <canvas class="ipx-canvas" aria-hidden="true"></canvas>
      <div class="ipx-notes-layer" aria-hidden="true"></div>
      <button class="ipx-nav ipx-prev" type="button" aria-label="Previous perfume">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="ipx-nav ipx-next" type="button" aria-label="Next perfume">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <div class="ipx-info" aria-live="polite"></div>

    <div class="ipx-scrub">
      <div class="ipx-track" role="tablist" aria-label="Choose a perfume"></div>
    </div>
  `;

  const stage = root.querySelector(".ipx-stage");
  const rail = root.querySelector(".ipx-rail");
  const canvas = root.querySelector(".ipx-canvas");
  const notesLayer = root.querySelector(".ipx-notes-layer");
  const info = root.querySelector(".ipx-info");
  const track = root.querySelector(".ipx-track");

  const engine = new SprayEngine(canvas);

  /* -------------------------------------------------------------- rendering */

  function buildSlides() {
    rail.innerHTML = perfumes
      .map(
        (p, i) => `
      <div class="ipx-slide" data-i="${i}" role="group" aria-roledescription="slide"
           aria-label="${esc(p.name)}, ${i + 1} of ${perfumes.length}">
        <div class="ipx-bottle">${renderBottle(p, `${uid}-${i}`)}${renderLabel(p)}</div>
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

  function renderInfo() {
    const p = perfumes[index];
    info.innerHTML = `
      <div class="ipx-info-in">
        <span class="ipx-collection">${esc(p.collection)}</span>
        <h3 class="ipx-name">${esc(p.name)}</h3>
        <p class="ipx-tagline">${esc(p.tagline)}</p>
        <dl class="ipx-notes">
          ${["top", "heart", "base"]
            .map(
              (role) => `
            <div class="ipx-note-row">
              <dt>${role}</dt>
              <dd>${p.notes[role].map((n) => esc(n)).join(" · ")}</dd>
            </div>`,
            )
            .join("")}
        </dl>
        <div class="ipx-meta">
          <span>${esc(p.concentration)}</span>
          <span class="ipx-dot"></span>
          <span>${esc(p.price)} · ${esc(p.size)}</span>
        </div>
        <div class="ipx-actions">
          <button class="ipx-btn ipx-btn-ghost ipx-spray-btn" type="button">Spray it</button>
          <button class="ipx-btn ipx-btn-solid ipx-cta" type="button">Discover</button>
        </div>
      </div>`;
  }

  function applyTheme() {
    const t = perfumes[index].theme;
    root.style.setProperty("--ipx-accent", t.accent);
    root.style.setProperty("--ipx-accent-soft", t.accentSoft);
    root.style.setProperty("--ipx-aura", t.aura);
  }

  /** Position every slide from the fractional `pos`. */
  function layout() {
    const slides = rail.children;
    for (let i = 0; i < slides.length; i++) {
      const d = i - pos;
      const ad = Math.min(Math.abs(d), 3);
      const scale = 1 - ad * 0.2;
      const opacity = Math.max(0, 1 - ad * 0.42);
      const blur = ad * 1.9;
      const lift = ad * 16;

      const el = slides[i];
      // Deliberately a 2D transform. A 3D one (translate3d/perspective/rotateY)
      // promotes each slide to its own compositing layer, where Chromium keeps
      // a stale raster of the bottle's SVG label text after the slide moves —
      // the plate and rules repaint, the glyphs don't. Depth still reads from
      // scale, blur and opacity.
      el.style.transform = `translate(${d * slideW}px, ${lift}px) scale(${Math.max(scale, 0.2)})`;
      el.style.opacity = String(opacity);
      // Drop the property entirely on the active slide rather than setting
      // `none`: an always-present filter promotes the slide to its own layer,
      // where SVG label text can fail to repaint after a transform.
      if (blur > 0.05) el.style.filter = `blur(${blur.toFixed(2)}px)`;
      else el.style.removeProperty("filter");
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.style.pointerEvents = ad < 0.5 ? "auto" : "none";
      el.setAttribute("aria-hidden", ad < 0.5 ? "false" : "true");
    }
  }

  function measure() {
    const w = stage.clientWidth || 640;
    slideW = clamp(w * 0.46, 190, 330);
    engine.resize();
    layout();
  }

  /* ------------------------------------------------------------------ spray */

  /** Nozzle position of a slide, in canvas-local CSS pixels. */
  function nozzleAt(i) {
    const slide = rail.children[i];
    if (!slide) return null;
    const anchor = slide.querySelector(".ipx-nozzle-anchor");
    if (!anchor) return null;

    const a = anchor.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    return { x: a.left + a.width / 2 - c.left, y: a.top + a.height / 2 - c.top };
  }

  function floatNotes(i, origin) {
    const p = perfumes[i];
    const pool = [...p.notes.top, ...p.notes.heart];
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, 2);

    picks.forEach((note, n) => {
      const el = document.createElement("span");
      el.className = "ipx-note-float";
      el.textContent = note;
      el.style.left = `${origin.x + 8 + n * 12}px`;
      el.style.top = `${origin.y - 4 - n * 34}px`;
      // Fan the words apart so two notes never land on top of each other.
      el.style.setProperty("--ipx-note-dx", `${58 + n * 30}px`);
      el.style.setProperty("--ipx-note-dy", `${-84 - n * 38}px`);
      el.style.animationDelay = `${n * 190}ms`;
      notesLayer.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    });
  }

  let firingTimer = null;

  /**
   * Fire the atomiser on a slide.
   * @param {number} [i]      Slide to spray. Defaults to the active one.
   * @param {number} [power]  0–1. Detent puffs use less than a full press.
   */
  function spray(i = index, power = 1) {
    const p = perfumes[i];
    const slide = rail.children[i];
    if (!p || !slide) return;

    slide.classList.remove("ipx-firing");
    void slide.offsetWidth; // restart the press animation
    slide.classList.add("ipx-firing");
    clearTimeout(firingTimer);
    firingTimer = setTimeout(() => slide.classList.remove("ipx-firing"), 460);

    root.classList.remove("ipx-pulse");
    void root.offsetWidth;
    root.classList.add("ipx-pulse");

    if (!reduced) {
      const origin = nozzleAt(i);
      if (origin) {
        engine.spray({
          x: origin.x,
          y: origin.y,
          color: p.theme.accent,
          colorSoft: p.theme.accentSoft,
          power,
        });
        if (power > 0.8) floatNotes(i, origin);
      }
    }

    if (opts.onSpray) opts.onSpray(p, i);
  }

  /* --------------------------------------------------------------- movement */

  let tween = null;

  function animateTo(target, duration = 560) {
    if (tween) cancelAnimationFrame(tween.raf);
    const from = pos;
    const delta = target - from;
    if (Math.abs(delta) < 0.0005) {
      pos = target;
      layout();
      return;
    }

    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      pos = from + delta * easeOutCubic(t);
      layout();
      if (t < 1) {
        tween.raf = requestAnimationFrame(step);
      } else {
        tween = null;
      }
    };
    tween = { raf: requestAnimationFrame(step) };
  }

  function setIndex(next, { animate = true, spraying = true } = {}) {
    const clamped = clamp(next, 0, perfumes.length - 1);
    const changed = clamped !== index;
    index = clamped;

    applyTheme();
    renderInfo();
    for (const tick of track.children) {
      tick.setAttribute("aria-selected", String(Number(tick.dataset.i) === index));
    }
    for (const slide of rail.children) {
      slide.classList.toggle("ipx-active", Number(slide.dataset.i) === index);
    }

    if (animate) animateTo(index, reduced ? 0 : 560);
    else {
      pos = index;
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

  function onPointerDown(e) {
    if (e.button != null && e.button > 0) return;
    if (e.target.closest("button")) return;

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

    let target = drag.startPos - dx / slideW;
    // Rubber band past the ends.
    const max = perfumes.length - 1;
    if (target < 0) target = target * 0.32;
    else if (target > max) target = max + (target - max) * 0.32;

    pos = target;
    layout();

    // Puff at each detent as it passes — "sprays as you slide".
    const detent = Math.round(pos);
    if (detent !== lastDetent && detent >= 0 && detent <= max) {
      lastDetent = detent;
      spray(detent, 0.5);
    }
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const flick = drag.v;
    const wasDrag = drag.moved;
    drag = null;
    root.classList.remove("ipx-dragging");

    if (!wasDrag) return;

    // A quick flick carries to the neighbouring slide.
    let target = Math.round(pos);
    if (Math.abs(flick) > 0.45) target = flick < 0 ? Math.ceil(pos) : Math.floor(pos);

    setIndex(target, { animate: true, spraying: true });
  }

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
    if (e.target.closest(".ipx-spray-btn")) return spray(index, 1);
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
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("click", onClick);

  const ro = new ResizeObserver(measure);
  ro.observe(stage);

  const onVisibility = () => document.hidden && engine.stop();
  document.addEventListener("visibilitychange", onVisibility);

  buildSlides();
  setIndex(index, { animate: false, spraying: false });
  measure();
  // Opening spray, once the layout has settled.
  const bootTimer = setTimeout(() => !destroyed && opts.sprayOnChange && spray(index, 1), 520);
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
      stopAutoplay();
      if (tween) cancelAnimationFrame(tween.raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      stage.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("click", onClick);
      engine.destroy();
      root.innerHTML = "";
      root.classList.remove("ipx-slider");
    },
  };
}

export default createPerfumeSlider;
