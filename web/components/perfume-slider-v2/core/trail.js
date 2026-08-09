/**
 * What you are wearing, pinned to the bottom of the screen.
 *
 * Spray something on the collection page and three thin strips slide up and
 * stay there — top, heart and base — carrying the materials in each, the hours
 * each is good for, and the share of the smell each holds at this moment. Then
 * they evaporate, top first, on the same curves the discover page uses.
 *
 * The point of it living down there rather than in the page is that a perfume
 * does not stop existing because you scrolled. You put it on; it is on you
 * while you carry on looking at other bottles, and it goes in its own time.
 *
 * Thin on purpose. This is a status line, not a panel — it has to say what is
 * on your skin without taking the screen away from the thing you came to look
 * at. One line per tier, and the pigment behind the type does the rest.
 *
 * Framework-agnostic, like everything else in here: it owns a bit of DOM and a
 * frame loop, and the slider drives it.
 */

import {
  OPENING_HOLD_MS,
  RUN_MS,
  TIERS,
  TIER_HANDOVER,
  TIER_LABEL,
  enduranceLabel,
  formatClock,
  formatHours,
  tierColor,
  tierHours,
  tierInk,
  tierMix,
  tierPresence,
  tierRising,
  totalHoursOf,
} from "./pyramid.js";
import { esc } from "./util.js";

/**
 * How long the tray stays up after the wear finishes.
 *
 * Long enough to read the line that closes it. The strips being spent is the
 * true picture but it is not the point — the point is that it lasted all day,
 * and that sentence needs a few seconds of nobody's attention being pulled.
 */
const RETIRE_MS = 3600;

/**
 * How long to let the spray have the screen before the tray comes up.
 *
 * Measured rather than guessed: firing the atomiser costs eleven long frames
 * on a machine with no GPU, and the tray was arriving inside them. Nothing was
 * wrong with the tray — it was landing in the busiest half second on the page,
 * which is the one place a slide-up cannot look smooth.
 *
 * So the mist goes first and the tray follows it into a quiet frame. It costs
 * nothing: the drydown holds at zero for its first second and a half anyway,
 * so this sits inside a stretch where nothing has happened yet.
 */
const SETTLE_MS = 430;

export class ScentTrail {
  /**
   * @param {HTMLElement} [host] where to mount. Defaults to the document body,
   *   which is what you want for something fixed to the viewport.
   */
  constructor(host) {
    this.host = host || document.body;
    this.el = document.createElement("aside");
    this.el.className = "ipx-trail";
    this.el.setAttribute("aria-live", "off");
    // Never in the way: it names what is on your skin, it is not a control.
    this.el.setAttribute("aria-label", "What you are wearing");

    // Where the mist comes down. Covers the tray and sits behind the strips,
    // so motes settle *into* the layer forming rather than over its type.
    this.canvas = document.createElement("canvas");
    this.canvas.className = "ipx-trail-fall";
    this.canvas.setAttribute("aria-hidden", "true");
    this.el.appendChild(this.canvas);

    this.host.appendChild(this.el);

    // The room the fixed tray needs, kept outside the page's own boxes.
    //
    // This used to be padding on the slider, which was a mistake with a very
    // visible symptom: the slider is a flex column whose stage takes the
    // slack, so growing its padding shrank the stage by a few pixels, which
    // tripped the slider's own ResizeObserver, which re-measured the table and
    // re-laid every bottle. Every press made the whole carousel jump. A spacer
    // after everything adds the same scroll room and resizes nothing.
    this.spacer = document.createElement("div");
    this.spacer.className = "ipx-trail-spacer";
    this.spacer.setAttribute("aria-hidden", "true");
    this.host.appendChild(this.spacer);

    this.motes = [];
    this.fallRaf = 0;
    this.fallLast = 0;
    this._fall = this._fall.bind(this);

    this.perfume = null;
    this.t0 = 0;
    this.raf = 0;
    this.retire = 0;
    this.rise = 0;
    this.built = null;
    /** How many tiers are on. One per press. */
    this.laid = 0;
    /** The layer being deposited right now, if any. */
    this.forming = null;
    /** Called with the hours it lasted, when the wear finishes. */
    this.onDone = null;
    this.lastT = 0;
    this._tick = this._tick.bind(this);
  }

  /**
   * Put a layer on.
   *
   * One tier per press, in the order the pyramid is built — base first, then
   * heart, then top. A perfume does not arrive on the skin as three finished
   * strata; showing all three the instant you touch the atomiser skips the only
   * part of this worth watching, which is the thing being assembled.
   *
   * The clock does not start until all three are down. Until then the strips
   * sit as they were put on, so you can look at what you have built.
   *
   * A different perfume starts again from nothing: this is what is on your
   * skin, and reaching for a second bottle is a different wear.
   */
  apply(perfume) {
    if (!perfume) return;
    clearTimeout(this.retire);
    if (this.built !== perfume.id) {
      this.perfume = perfume;
      this.laid = 0;
      this._build(perfume);
    }
    // Pressing again once it is all on tops the wear up. It used to tear the
    // tray back down to a lone base, which is not what spraying more perfume
    // on does — you do not lose the heart and the base by adding to them. All
    // three refill, the clock goes back to the start, and it reads as what it
    // is: the same perfume, freshly on.
    const refill = this.laid >= TIERS.length;
    if (!refill) this.laid += 1;

    const tier = TIERS[this.laid - 1];
    // Empty until the mist reaches it. t0 is set when the fall actually
    // starts, so a strip that is on screen but not yet being rained on simply
    // sits at nothing rather than counting down from a clock nobody started.
    // A refill re-forms every layer at once; a build re-forms only the new one.
    // Where each layer is starting from. A fresh one starts at nothing; a
    // refill starts at whatever is left of it and rises to full. Dropping a
    // half-worn layer to zero so it could fill up again would be the layers
    // vanishing and coming back, which is the opposite of topping up — you do
    // not lose what is on your skin by adding to it.
    const is = refill ? TIERS.map((_, i) => i) : [this.laid - 1];
    const from = {};
    for (const i of is) from[i] = refill ? (this.strips?.[i]?.level ?? 0) : 0;
    this.forming = { is, from, t0: 0, dur: 1150, refill };
    this._reveal();
    this._show(true);

    if (this.laid < TIERS.length) {
      // Not standing yet. Hold every layer at full and leave the clock alone.
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this._paint(0);
      return tier;
    }

    this.t0 = performance.now();
    this._paint(0);
    if (!this.raf) this.raf = requestAnimationFrame(this._tick);
    return tier;
  }

  /** How many layers are down, so the caller can talk about what just landed. */
  get count() {
    return this.laid;
  }

  /**
   * The mist coming down to become a layer.
   *
   * Given the point the spray left the bottle, in viewport coordinates. Motes
   * drift from there down to the strip that is forming and settle along it, so
   * the layer is seen to be made of what was just sprayed rather than appearing
   * because a counter went up.
   *
   * They arrive over about a second, spread across the strip and at slightly
   * different times, because a cloud does not reach a surface all at once.
   */
  settle(from) {
    if (!this.strips || !this.laid || !from || !this.forming) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = this.forming.is.map((i) => this.strips[i]).filter(Boolean);
    if (!targets.length) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = this.el.getBoundingClientRect();
    if (!box.width) return;
    const w = Math.round(box.width * dpr);
    const h = Math.round(box.height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Worked in the tray's own box. The tray is fixed, so subtracting its rect
    // from a viewport point is all the conversion needed.
    const x0 = from.x - box.left;
    const y0 = from.y - box.top;
    // A refill rains on all three at once, so the cloud is shared out between
    // them rather than each getting a full one — three full clouds at once is
    // a downpour, and this is a spray.
    const each = Math.max(16, Math.round(44 / targets.length));

    for (const s of targets) {
      // Each layer's own pigment, so a refill is visibly three colours coming
      // down rather than one.
      const color = tierColor(this.perfume.theme, s.tier);
      const strip = s.li.getBoundingClientRect();
      const restY = strip.top - box.top + strip.height * 0.6;
      for (let i = 0; i < each; i++) {
        this.motes.push({
          x: x0 + (Math.random() - 0.5) * 46,
          y: y0 + (Math.random() - 0.5) * 30,
          tx: strip.left - box.left + Math.random() * strip.width,
          ty: restY + (Math.random() - 0.5) * strip.height * 0.5,
          r: 0.7 + Math.pow(Math.random(), 2.4) * 2.6,
          t: 0,
          dur: 620 + Math.random() * 780,
          wob: (Math.random() - 0.5) * 26,
          color,
        });
      }
    }
    // The layers start arriving now, with the first motes.
    this.forming.t0 = performance.now();
    for (const s of targets) {
      s.li.classList.remove("ipx-strip-pending");
      s.li.classList.add("ipx-strip-forming");
    }
    if (!this.fallRaf) {
      this.fallLast = performance.now();
      this.fallRaf = requestAnimationFrame(this._fall);
    }
  }

  _fall(now) {
    const ms = Math.min(now - this.fallLast, 50);
    this.fallLast = now;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = "lighter";

    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.t += ms;
      const u = Math.min(m.t / m.dur, 1);
      // Eased on the way down, with a sideways drift that dies as it lands —
      // which is what falling through air looks like.
      const e = 1 - Math.pow(1 - u, 2.2);
      const x = m.x + (m.tx - m.x) * e + Math.sin(u * Math.PI * 1.6) * m.wob * (1 - u);
      const y = m.y + (m.ty - m.y) * e;
      // Bright in the air, dimming as it joins the layer.
      const a = u < 0.82 ? 0.5 + 0.3 * Math.sin(u * Math.PI) : 0.8 * (1 - (u - 0.82) / 0.18);

      ctx.globalAlpha = Math.max(0, a) * 0.55;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(x, y, m.r * (1 - u * 0.35), 0, Math.PI * 2);
      ctx.fill();

      if (u >= 1) this.motes.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Keep the layer filling in step with the mist landing on it. Only while
    // it is still forming — once it is down, the drydown loop owns it.
    if (this.forming) this._paint(this.raf ? this.lastT || 0 : 0);

    // Self-stopping: nothing falling, nothing running.
    this.fallRaf = this.motes.length || this.forming ? requestAnimationFrame(this._fall) : 0;
  }

  /** Show the strips that have been laid, and hide the ones that have not. */
  _reveal() {
    if (!this.strips) return;
    // DOM order is base, heart, top — which is also the order they go on.
    this.strips.forEach((s, i) => {
      s.li.hidden = i >= this.laid;
      // The one about to be rained on waits in the dark. Without this it
      // spends the moment between the tray rising and the mist arriving as
      // full-strength type on an empty band, which is the one frame that gives
      // away that the strip was there before the perfume was.
      const pending =
        !!this.forming && !this.forming.t0 && this.forming.is.includes(i);
      s.li.classList.toggle("ipx-strip-pending", pending);
    });
    const complete = this.laid >= TIERS.length;
    this.el.classList.toggle("ipx-trail-building", !complete);
    if (this.headHint) {
      // While it is being built the clock reads 0m and means nothing, so the
      // room goes to what to do next. Once it is standing, the head says what
      // the clock is — a long wear played fast, not a perfume in a hurry.
      this.headHint.textContent = complete
        ? "time-lapse"
        : `${TIERS.length - this.laid} more to go`;
    }
  }

  clear() {
    clearTimeout(this.retire);
    clearTimeout(this.rise);
    if (this.fallRaf) cancelAnimationFrame(this.fallRaf);
    this.fallRaf = 0;
    this.motes.length = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this._show(false);
  }

  /**
   * Raise or lower the tray, and tell the page how much room it is taking.
   *
   * It is fixed, so it sits over whatever is underneath it — which on the
   * collection page is the caption naming the perfume. Publishing its height
   * as a custom property lets the page underneath make room rather than be
   * covered, and a page that ignores it is no worse off than before.
   */
  _show(on) {
    const root = document.documentElement;
    // Measured every time, not once: the tray grows a strip at a time, and the
    // page reserving room for it has to be told the new height each press.
    // Room first, movement second, and never in the same frame.
    //
    // Publishing the height reflows the page that reserves it, and a reflow
    // landing in the middle of the tray's rise is what made the rise stutter.
    // Doing it a frame ahead means the document settles at its new height
    // while nothing is moving, and the transform that follows is a composite
    // with no layout left to do.
    const h = on ? Math.round(this.el.getBoundingClientRect().height) : 0;
    root.style.setProperty("--ipx-trail-h", `${h}px`);
    this.spacer.style.height = `${h}px`;
    root.classList.toggle("ipx-trail-open", on);
    if (!on) {
      clearTimeout(this.rise);
      this.el.classList.remove("ipx-trail-on");
      return;
    }
    clearTimeout(this.rise);
    this.rise = setTimeout(() => this.el.classList.add("ipx-trail-on"), SETTLE_MS);
  }

  /** Where the tray sits once it is up, for anything that has to clear it. */
  get top() {
    return window.innerHeight - this.el.getBoundingClientRect().height;
  }

  destroy() {
    this.clear();
    this.el.remove();
    this.spacer.remove();
    document.documentElement.style.removeProperty("--ipx-trail-h");
  }

  /* ------------------------------------------------------------------ build

     Written once per perfume. The frame loop only touches the values that
     move — the same split the discover page needed, for the same reason: an
     element rebuilt every frame can never run a transition. */

  _build(p) {
    const total = totalHoursOf(p);
    const rows = TIERS.map((tier) => {
      const pig = tierColor(p.theme, tier);
      const ink = tierInk(p.theme, tier);
      const notes = (p.notes?.[tier] || []).join(" · ");
      return `<li class="ipx-strip" data-tier="${tier}" style="--ipx-pig:${pig}">
        <span class="ipx-powder"></span>
        <b class="ipx-strip-tier" style="color:${ink}">${TIER_LABEL[tier]}</b>
        <span class="ipx-strip-notes">${esc(notes)}</span>
        <span class="ipx-strip-share"></span>
        <span class="ipx-strip-hours">${esc(formatHours(tierHours(tier, total)))}</span>
      </li>`;
    }).join("");

    this.el.innerHTML = `
      <div class="ipx-trail-head">
        <span class="ipx-trail-name">${esc(p.name)}</span>
        <span class="ipx-trail-hint"></span>
        <span class="ipx-trail-total"><b class="ipx-trail-clock">0m</b><span class="ipx-trail-of"> of ${total}h on skin</span></span>
      </div>
      <ol class="ipx-trail-strips">${rows}</ol>`;
    // innerHTML above wipes everything inside, the fall canvas included — it
    // is owned by this object rather than by the markup, so it goes back in.
    this.el.appendChild(this.canvas);
    this.built = p.id;
    this.strips = TIERS.map((tier) => {
      const li = this.el.querySelector(`[data-tier="${tier}"]`);
      return {
        tier,
        li,
        powder: li.querySelector(".ipx-powder"),
        share: li.querySelector(".ipx-strip-share"),
      };
    });
    this.clockEl = this.el.querySelector(".ipx-trail-clock");
    this.headHint = this.el.querySelector(".ipx-trail-hint");
  }

  /* ------------------------------------------------------------------ paint */

  _tick(now) {
    // Kept so the fall loop can repaint at the right point in the drydown
    // while the last layer is still being deposited.
    // The same opening hold the discover page uses, so the two agree about
    // what the first moment looks like: all three up, nothing gone yet.
    const t = Math.min(Math.max(0, now - this.t0 - OPENING_HOLD_MS) / RUN_MS, 1);
    this.lastT = t;
    this._paint(t);
    if (t < 1) {
      this.raf = requestAnimationFrame(this._tick);
      return;
    }
    this.raf = 0;

    // How it ends matters. Three spent strips and a clock reading twelve hours
    // is a true picture that leaves the wrong impression — the last thing on
    // screen would be emptiness. What actually happened is that the perfume
    // lasted all day, so that is what it says before it goes.
    const hours = totalHoursOf(this.perfume);
    if (this.headHint) this.headHint.textContent = enduranceLabel(hours).toLowerCase();
    this.el.classList.add("ipx-trail-done");
    // Whoever is driving gets told, so anything it is saying about the wear
    // can stop saying "now watch" once there is nothing left to watch.
    if (this.onDone) this.onDone(hours);
    this.retire = setTimeout(() => {
      this._show(false);
      this.el.classList.remove("ipx-trail-done");
    }, RETIRE_MS);
  }

  /**
   * The mix, over the tiers that have been laid down.
   *
   * Once all three are on this is just tierMix. Before that it is renormalised
   * over what is present, so a lone base note reads as the whole of what is
   * on the skin rather than a quarter of a composition that does not exist.
   */
  _mixOf(t) {
    const full = tierMix(t);
    if (this.laid >= TIERS.length) return full;
    const on = TIERS.slice(0, this.laid);
    const sum = on.reduce((n, tier) => n + full[tier], 0) || 1;
    const out = { top: 0, heart: 0, base: 0 };
    for (const tier of on) out[tier] = full[tier] / sum;
    return out;
  }

  /**
   * How much of a strip has been laid down, 0 to 1.
   *
   * Everything already on the skin is 1 — this only concerns the layer being
   * deposited right now. Before the mist reaches it the answer is 0, which is
   * what makes the strip arrive empty rather than finished.
   */
  /** What level a layer being deposited is rising from. */
  _formFrom(s) {
    const f = this.forming;
    if (!f) return 0;
    const i = this.strips.indexOf(s);
    return f.is.includes(i) ? f.from[i] || 0 : 0;
  }

  _formOf(s) {
    const f = this.forming;
    const i = this.strips.indexOf(s);
    if (!f || !f.is.includes(i)) return 1;
    if (!f.t0) return 0;
    const u = (performance.now() - f.t0) / f.dur;
    if (u >= 1) {
      for (const j of f.is) {
        this.strips[j]?.li.classList.remove("ipx-strip-forming", "ipx-strip-pending");
      }
      this.forming = null;
      return 1;
    }
    // Slower at the start: the first motes have barely touched it, and most of
    // the layer arrives in the middle of the fall.
    return u < 0 ? 0 : u * u * (3 - 2 * u);
  }

  _paint(t) {
    const p = this.perfume;
    if (!p || !this.strips) return;
    const total = totalHoursOf(p);
    // While it is still being built the share is taken over the layers that
    // are actually on. With only the base down, "25% of what you smell" is a
    // share of two things that are not there yet — the honest answer is all
    // of it, because it is all there is.
    const mix = this._mixOf(t);
    const lead = Math.max(mix.top, mix.heart, mix.base, 1e-6);

    this.clockEl.textContent = formatClock(total * t);

    for (const s of this.strips) {
      const left = tierPresence(s.tier, t);
      const share = mix[s.tier];
      const rising = tierRising(s.tier, t);

      // Same front as the discover page: -30% is untouched, 100% is gone —
      // and the same front, run backwards, is the layer being laid down. A
      // strip still forming is held between the two, so the powder fills from
      // the bottom as the mist reaches it instead of being there already.
      // How deep the powder lies, as a fraction of the strip: it is heading
      // for whatever the tier has left, from wherever it was when the mist
      // started arriving. Once nothing is being deposited the two are the same
      // thing and this is simply the tier wearing off.
      const f = this._formOf(s);
      const start = this._formFrom(s);
      const level = start + (left - start) * f;
      s.level = level;
      s.powder.style.setProperty("--ipx-fill", (level * 100).toFixed(1) + "%");
      s.powder.style.setProperty("--ipx-lead", (share / lead).toFixed(3));
      s.powder.classList.toggle("ipx-rising", rising && left > 0.05);

      // A strip does not vanish when its tier does — it goes quiet and keeps
      // its place, so the three of them stay a stack rather than a list that
      // shortens. The type stays readable either way.
      s.li.style.opacity = (0.34 + 0.66 * Math.max(left, share)).toFixed(3);
      // Not "gone". A tier that has run its course did something — it opened
      // the perfume up, or carried the day, or stayed to the end — and that is
      // the same copy the discover page uses for the same moment. A strip is
      // the record of what a layer did, not a note that it is missing.
      s.share.textContent =
        left <= 0.05 ? TIER_HANDOVER[s.tier] : `${Math.round(share * 100)}%`;
      s.share.classList.toggle("ipx-strip-did", left <= 0.05);
    }
  }
}
