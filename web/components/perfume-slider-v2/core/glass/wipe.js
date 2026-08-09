/**
 * Wipe — dragging a hand across wet glass.
 *
 * A wipe does not delete liquid, it moves it. Everything the stroke touches is
 * gathered into a bead riding at the leading edge, which grows as it collects
 * and is left behind as drops when the stroke stops — the way a squeegee sheds
 * what it has been pushing. The path clears behind it, with a thin film left
 * along the edges.
 *
 * The bead comes off as a row, not a blob: it is a line of liquid lying across
 * the direction of travel, and dumping it on one spot leaves a lump parked
 * wherever the stroke happened to stop.
 */

import { clamp, rand, toRGBA } from "../util.js";
import { roundDrop, segmentDistance } from "./sprites.js";

/** How wide a swathe the hand takes with it, in canvas pixels. */
const REACH = 42;

/** A gap longer than this starts a new stroke instead of sweeping between. */
const BREAK_MS = 200;

/** The stroke has stopped; whatever it was pushing settles. */
const SHED_MS = 130;

export class Wipe {
  constructor() {
    this.smears = [];
    this.bead = null;
    this._last = null;
  }

  isEmpty() {
    return !this.smears.length && !this.bead;
  }

  clear() {
    this.smears.length = 0;
    this.bead = null;
    this._last = null;
  }

  /** Break the stroke, so returning to the glass does not sweep a chord. */
  end() {
    this._last = null;
  }

  /**
   * Wipe. Call with the pointer position as it moves.
   *
   * @param {number} x Canvas CSS pixels.
   * @param {number} y
   * @param {import("./droplets.js").Droplets} droplets
   * @param {import("./oil.js").Oil} oil
   */
  at(x, y, droplets, oil) {
    const now = performance.now();
    const prev = this._last;
    this._last = { x, y, t: now };

    if (!prev || now - prev.t > BREAK_MS) return;
    if (Math.hypot(x - prev.x, y - prev.y) < 1.5) return;

    let gathered = 0;
    let color = this.bead ? this.bead.color : null;

    // Everything is tested where it actually is, not where it landed — the
    // glass travels with its bottle as the collection turns.
    for (let i = droplets.drops.length - 1; i >= 0; i--) {
      const d = droplets.drops[i];
      if (segmentDistance(droplets.screenX(d), d.y, prev.x, prev.y, x, y) > REACH + d.r) continue;
      // Area stands in for volume, so a fat drop contributes what it should.
      gathered += d.r * d.r;
      color = color || d.color;
      droplets.drops.splice(i, 1);
    }

    for (let i = droplets.residues.length - 1; i >= 0; i--) {
      const res = droplets.residues[i];
      if (segmentDistance(droplets.screenX(res), res.y, prev.x, prev.y, x, y) > REACH) continue;
      color = color || res.color;
      droplets.residues.splice(i, 1);
    }

    color = color || oil.wipeAlong(prev.x, prev.y, x, y, REACH);
    if (!color) return;

    // The film dragged out to either side. Points accumulate into one path:
    // drawing each segment separately blends the overlaps twice, and the trail
    // comes out scalloped.
    let smear = this.smears[this.smears.length - 1];
    if (!smear || !smear.active) {
      smear = {
        points: [{ x: prev.x, y: prev.y }],
        r: REACH,
        color,
        active: true,
        life: 0,
        max: rand(380, 700),
        alpha: rand(0.04, 0.09),
      };
      this.smears.push(smear);
    }
    smear.points.push({ x, y });
    if (smear.points.length > 400) smear.points.shift();

    if (!this.bead) this.bead = { x, y, vol: 0, angle: 0, color, idle: 0 };
    this.bead.vol += gathered;
    this.bead.x = x;
    this.bead.y = y;
    this.bead.angle = Math.atan2(y - prev.y, x - prev.x);
    this.bead.idle = 0;
  }

  /** @param {import("./droplets.js").Droplets} droplets */
  step(ms, droplets) {
    const idle = this._last ? performance.now() - this._last.t : Infinity;

    for (let i = this.smears.length - 1; i >= 0; i--) {
      const sm = this.smears[i];
      if (sm.active) {
        if (idle > 160) sm.active = false;
        continue; // a stroke still being drawn does not age
      }
      sm.life += ms;
      if (sm.life >= sm.max) this.smears.splice(i, 1);
    }

    if (this.bead) {
      this.bead.idle += ms;
      if (this.bead.idle > SHED_MS) this._shed(droplets);
    }
  }

  /** The bead loses its grip and falls back to the glass as a row of drops. */
  _shed(droplets) {
    const bead = this.bead;
    this.bead = null;
    if (!bead || bead.vol < 4) return;

    const across = clamp(Math.sqrt(bead.vol) * 2.6, 10, 190);
    const pieces = clamp(Math.round(across / 26), 2, 7);
    const nx = -Math.sin(bead.angle);
    const ny = Math.cos(bead.angle);

    for (let i = 0; i < pieces; i++) {
      const r = clamp(Math.sqrt(bead.vol / pieces), 1.4, 9);
      // Spread along the bead, with the ends thinning out the way they do.
      const t = pieces === 1 ? 0 : (i / (pieces - 1) - 0.5) * 2;
      const off = t * across * 0.5 + rand(-4, 4);
      droplets.drops.push({
        x: bead.x + nx * off + rand(-3, 3),
        y: bead.y + ny * off + rand(-3, 3),
        r,
        r0: r,
        alpha: rand(0.5, 0.9),
        life: 0,
        max: clamp(360 * Math.pow(r, 1.5), 700, 5000),
        runAt: r > 5.6 ? rand(200, 900) : Infinity,
        runDist: rand(16, 48) + r * 5,
        vy: 0,
        trail: 0,
        settle: 0,
        squash: r > 3.5 ? rand(0.84, 0.95) : rand(0.94, 1.06),
        // Shed where the hand left them, so they travel from here on.
        ax: droplets.anchor,
        color: bead.color,
      });
    }
  }

  /**
   * Draw the dragged-out film. Flat alpha along the path, not a gradient: a
   * stroke that fades at both ends leaves a gap where it meets the next one,
   * and the trail comes out as a row of dashes instead of a smear.
   */
  draw(g) {
    g.lineCap = "round";
    g.lineJoin = "round";

    for (const sm of this.smears) {
      if (sm.points.length < 2) continue;
      const t = sm.life / sm.max;
      g.globalAlpha = sm.alpha * (1 - t);
      g.strokeStyle = toRGBA(sm.color, 1);
      g.lineWidth = sm.r * 1.5 * (1 - t * 0.4);
      g.beginPath();
      g.moveTo(sm.points[0].x, sm.points[0].y);
      for (let i = 1; i < sm.points.length; i++) g.lineTo(sm.points[i].x, sm.points[i].y);
      g.stroke();
    }
    g.globalAlpha = 1;

    // Liquid piled up at the leading edge, gathered across the direction of
    // travel rather than along it.
    if (this.bead && this.bead.vol > 2) {
      const b = this.bead;
      const across = clamp(Math.sqrt(b.vol) * 2.6, 10, 190);
      const along = clamp(Math.sqrt(b.vol) * 0.9, 5, 34);
      g.save();
      g.translate(b.x, b.y);
      g.rotate(b.angle);
      g.globalAlpha = 0.75;
      g.drawImage(roundDrop(b.color), -along / 2, -across / 2, along, across);
      g.restore();
      g.globalAlpha = 1;
    }
  }
}

export default Wipe;
