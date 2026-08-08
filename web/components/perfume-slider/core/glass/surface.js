/**
 * GlassSurface — the pane between the viewer and the bottle.
 *
 * This owns the canvas, the device-pixel scaling and the frame loop, and
 * nothing else. What actually lives on the glass is three separate things, and
 * they are kept that way:
 *
 *   droplets — atomised spray that lands, coalesces and dries        (spray)
 *   oil      — a viscous film drawn on with a rod, which stays       (attar)
 *   wipe     — a hand dragging across, gathering and shedding liquid (both)
 *
 * Compositing is the reason the draw order is fixed here rather than inside
 * each part. Shadows and oil darken the scene, so they go down in source-over;
 * water and mist add light, so they go on top in lighter. Mixing the two inside
 * one part is how oil ended up as a bright welt instead of a film.
 *
 * The loop stops itself the moment nothing is left, and the canvas is cleared
 * on the way out — an idle slide costs nothing.
 */

import { Droplets } from "./droplets.js";
import { Oil } from "./oil.js";
import { Wipe } from "./wipe.js";

const FRAME = 1000 / 60;

export class GlassSurface {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.droplets = new Droplets();
    this.oil = new Oil();
    this.wiper = new Wipe();

    /** Called when the glass becomes wet or finishes drying. @type {?(wet:boolean)=>void} */
    this.onWetChange = null;
    this._wet = false;

    /**
     * Which perfume put this here.
     *
     * The caller owns the meaning — it is only ever handed back so the caller
     * can work out where that bottle is now and pass it to setAnchor.
     */
    this.owner = 0;

    this.running = false;
    this.last = 0;
    this.w = 0;
    this.h = 0;
    this._loop = this._loop.bind(this);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // See spray.js's resize() for why this is capped at 1.5, not 2: this is
    // the larger of the two canvases (spans the whole slider, not just the
    // stage), so it is also the more likely of the two to be the one a
    // constrained device runs out of compositor memory on.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.w = rect.width;
    this.h = rect.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Tell the glass where the bottle it belongs to has got to.
   *
   * Liquid belongs to the perfume that put it there. Turn the table and the
   * drops have to travel with their own bottle, or they hang in the air over
   * whatever comes round next. One number: the bottle's x offset from where it
   * sits when it is front and centre. Everything already on the glass records
   * the anchor it was born at and is drawn relative to it.
   *
   * @param {number} x
   */
  get anchor() {
    return this.droplets.anchor;
  }

  setAnchor(x) {
    if (x === this.droplets.anchor) return;
    this.droplets.anchor = x;
    this.oil.anchor = x;
    // Something moved even if no physics ran, so the frame has to be redrawn.
    if (!this._idle()) this.start();
  }

  // --- spray -------------------------------------------------------------

  /**
   * Fire the atomiser at the viewer.
   * @param {object} o
   * @param {number} o.x Where the nozzle points, in canvas CSS pixels.
   * @param {number} o.y
   * @param {string} o.color
   * @param {string} [o.colorSoft]
   * @param {number} [o.power] 0–1.
   * @param {{name: string, persistence: number}[]} [o.notes]
   * @param {(note: string, x: number, y: number, r: number, ms: number) => void} [o.onLabel]
   *   Called as named droplets land. The engine draws only to canvas, so the
   *   caller owns the text.
   */
  spray(o) {
    if (!this.w) this.resize();
    if (!this.w) return;
    if (o.owner != null) this.owner = o.owner;
    this.droplets.spray({ ...o, w: this.w, h: this.h });
    this.start();
  }

  // --- rod ---------------------------------------------------------------

  /** Start a stroke of oil. */
  oilBegin(o) {
    if (!this.w) this.resize();
    if (!this.w) return;
    if (o.owner != null) this.owner = o.owner;
    this.oil.begin(o);
    this.start();
  }

  /** Continue it. */
  oilTo(x, y) {
    this.oil.to(x, y);
    this.start();
  }

  /** Lift the rod. */
  oilEnd() {
    this.oil.end();
  }

  // --- wipe --------------------------------------------------------------

  /** Wipe the glass. Call with the pointer position as it moves. */
  wipe(x, y) {
    if (!this.w) return;
    this.wiper.at(x, y, this.droplets, this.oil);
    this.start();
  }

  /** Break the stroke, so returning to the glass does not sweep a chord. */
  endWipe() {
    this.wiper.end();
  }

  // --- state -------------------------------------------------------------

  /** Is there anything on the glass worth wiping? */
  hasLiquid() {
    return this.droplets.hasLiquid() || this.oil.hasLiquid();
  }

  /**
   * Is there liquid right here?
   *
   * This decides whether a press wipes or browses, so it is deliberately
   * narrow: droplets only. Two things are excluded on purpose.
   *
   *   residue — close to permanent, so counting it would mean the glass never
   *             reads as clean again.
   *   oil     — an attar lays a stroke down the moment it arrives and that
   *             stroke lives for twenty seconds. Counting it locks the
   *             carousel for the whole time, which is worse than the thing it
   *             would buy.
   *
   * Both still wipe off. Wiping is passive — it follows the pointer whenever
   * hasLiquid() says there is something there — and that check is the wide
   * one. This is only about what a *press* commits to.
   */
  isWetAt(x, y, reach = 80) {
    return this.droplets.isWetAt(x, y, reach);
  }

  clear() {
    this.droplets.clear();
    this.oil.clear();
    this.wiper.clear();
    if (this._wet) {
      this._wet = false;
      if (this.onWetChange) this.onWetChange(false);
    }
    if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
  }

  // --- loop --------------------------------------------------------------

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
  }

  _idle() {
    return this.droplets.isEmpty() && this.oil.isEmpty() && this.wiper.isEmpty();
  }

  _loop(now) {
    if (!this.running) return;

    const ms = Math.min(now - this.last, 50);
    this.last = now;

    this.droplets.step(ms / FRAME, ms, this.h);
    this.oil.step(ms);
    this.wiper.step(ms, this.droplets);

    // What the cursor promises has to match what the drag will do, so this is
    // the narrow question — liquid that actually claims the gesture — not the
    // wide one that decides whether there is anything to draw.
    const wet = this.droplets.hasClaimedLiquid() || this.oil.hasLiquid();
    if (wet !== this._wet) {
      this._wet = wet;
      if (this.onWetChange) this.onWetChange(wet);
    }

    this._draw();

    if (this._idle()) {
      this.running = false;
      if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
    } else {
      requestAnimationFrame(this._loop);
    }
  }

  _draw() {
    const g = this.ctx;
    if (!this.w) return;

    g.clearRect(0, 0, this.w, this.h);

    // Down first, in source-over — these are the parts that darken the scene.
    g.globalCompositeOperation = "source-over";
    this.droplets.drawShadows(g);
    this.oil.draw(g);

    // On top, additively — water and mist bend light toward you.
    g.globalCompositeOperation = "lighter";
    this.droplets.draw(g, this.w, this.h);
    this.wiper.draw(g);

    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  }

  destroy() {
    this.stop();
    this.clear();
  }
}

export default GlassSurface;
