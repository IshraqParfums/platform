/**
 * Droplets — what an atomiser leaves on the glass.
 *
 * Owns one thing: liquid that arrives as spray and dries. Two acts:
 *
 *   approach — particles rush outward from the nozzle, accelerating and
 *              swelling as they close on the lens. Radial expansion plus
 *              growth is what the eye reads as "coming toward me". Some
 *              overshoot and pass without ever landing.
 *   landing  — each arrival becomes a droplet. Travel time scales with
 *              distance, so the glass wets from the middle outward.
 *
 * Drying follows the d²-law: surface area falls linearly with time, so the
 * radius goes as sqrt(1 - t) and lifetime scales with size. Drops shrink
 * rather than fade, which is the difference between drying and a light being
 * turned down.
 */

import { clamp, gauss, rand, toRGBA } from "../util.js";
import { PENDANT, blob, pendantDrop, roundDrop } from "./sprites.js";

const TAU = Math.PI * 2;

/**
 * No drop may grow past this.
 *
 * Coalescence compounds: every merge makes a drop bigger, which makes it reach
 * further, which makes it merge again. Left uncapped a screenful collapses
 * into one enormous bead sitting in the middle, which is what happens if you
 * let the physics run away with itself.
 */
const MAX_RADIUS = 7;

/** Radius under evaporation, with a wobble if it has just swallowed another. */
function radiusOf(d) {
  const wobble = d.settle > 0 ? 1 + Math.sin(d.settle / 42) * (d.settle / 260) * 0.16 : 1;
  return d.r * wobble * Math.sqrt(Math.max(0, 1 - d.life / d.max));
}

/** Alpha only has to land the drop and soften the last moment. */
function alphaOf(d) {
  const t = d.life / d.max;
  if (t < 0.04) return t / 0.04;
  return t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
}

export class Droplets {
  constructor() {
    this.incoming = [];
    this.drops = [];
    this.splats = [];
    this.residues = [];
    this.haze = null;
    this._labels = [];
    this._onLabel = null;
    this._placed = [];
    this._origin = { x: 0, y: 0 };
    this._mergeIn = 0;
    /**
     * Where the bottle that sprayed this is, right now.
     *
     * Liquid belongs to the perfume that threw it. Slide the collection along
     * and the glass has to travel with the bottle, or the drops sit in mid-air
     * over whatever arrives next. Every particle records the anchor it was born
     * at, and everything is drawn — and hit-tested — offset by how far the
     * anchor has moved since.
     */
    this.anchor = 0;
  }

  /** How far this has travelled since it landed. */
  dx(it) {
    return this.anchor - it.ax;
  }

  /** Where it actually is on screen. */
  screenX(it) {
    return it.x + this.anchor - it.ax;
  }

  isEmpty() {
    return (
      !this.incoming.length && !this.drops.length && !this.splats.length &&
      !this.residues.length && !this.haze
    );
  }

  hasLiquid() {
    return this.drops.length > 0 || this.residues.length > 0;
  }

  /**
   * Liquid somebody meant to put there — what the cursor should be promising.
   *
   * hasLiquid() is the wider question and drives whether there is anything to
   * draw. This is the narrow one: passive puffs are on the glass and are drawn,
   * but they do not turn a drag into a wipe, so a cursor that says "wipe"
   * because of them is promising something that will not happen.
   */
  hasClaimedLiquid() {
    return this.drops.some((d) => !d.passive);
  }

  /**
   * Is there liquid right here? Residue is excluded: it is close to permanent,
   * and treating it as wet would mean the glass never reads as clean.
   */
  /**
   * Is there liquid here that somebody meant to put here?
   *
   * Passive drops are excluded, and that distinction is the whole point of the
   * flag. The slider puffs a little mist as each bottle turns past the front,
   * which lands on the glass — and a wet glass turns the next drag into a wipe.
   * Counting that liquid meant dragging the carousel wet the glass, which then
   * took the drag away: you would swipe, the bottles would not move, and the
   * gesture that caused it looked broken. Liquid you did not ask for must not
   * take the gesture away. Liquid you fired at yourself is another matter, and
   * wiping it off is the point of it being there.
   */
  isWetAt(x, y, reach = 80) {
    return this.drops.some(
      (d) => !d.passive && Math.hypot(this.screenX(d) - x, d.y - y) < reach + d.r,
    );
  }

  clear() {
    this.incoming.length = 0;
    this.drops.length = 0;
    this.splats.length = 0;
    this.residues.length = 0;
    this._labels = [];
    this._placed = [];
    this.haze = null;
  }

  /**
   * Fire at the viewer.
   * @param {object} o
   * @param {number} o.x  Where the nozzle points, in canvas pixels.
   * @param {number} o.y
   * @param {number} o.w  Canvas size, for reach and density.
   * @param {number} o.h
   * @param {string} o.color
   * @param {string} [o.colorSoft]
   * @param {number} [o.power]
   * @param {{name: string, persistence: number}[]} [o.notes]
   * @param {(note: string, x: number, y: number, r: number, ms: number) => void} [o.onLabel]
   */
  spray({ x, y, w, h, color, colorSoft, power = 1, notes = [], onLabel = null, passive = false }) {
    const soft = colorSoft || color;
    this._labels = onLabel ? notes.slice().sort(() => Math.random() - 0.5) : [];
    this._onLabel = onLabel;
    this._placed = [];
    this._origin = { x, y };
    this._bounds = { w, h };

    const reach = Math.min(w, h) * 0.72;
    // Scale with the glass: a phone has a fraction of the area to cover.
    const density = clamp(Math.sqrt((w * h) / (1280 * 900)), 0.55, 1.15);
    const count = Math.round(130 * power * density);

    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const dist = Math.abs(gauss()) * reach;
      // Continuous, skewed small: a lot of fine mist, a few fat drops. The
      // steeper power (4, not 3) pushes the distribution further toward the
      // fine end, and the lower ceiling keeps even the rare fat one from
      // reading as a splash rather than an atomised drop.
      const r = (0.35 + Math.pow(Math.random(), 4) * 5.5) * power;
      const passes = Math.random() < 0.28;
      const travel = passes ? dist + rand(reach * 0.6, reach * 1.4) : dist;

      this.incoming.push({
        ox: x,
        oy: y,
        tx: x + Math.cos(a) * travel,
        ty: y + Math.sin(a) * travel * 0.86,
        // Farther particles take longer, so the glass wets outward in waves.
        delay: rand(0, 90),
        dur: 150 + dist * 1.15 + rand(0, 240),
        age: 0,
        r,
        passes,
        passive,
        ax: this.anchor,
        color: r > 4 ? soft : color,
      });
    }

    this.haze = { x, y, color: soft, age: 0, life: 1700, power, ax: this.anchor };
  }

  /** An arriving particle becomes a droplet sitting on the glass. */
  _land(p) {
    const note = this._pickLabel(p);
    // Size dominates lifetime; an ingredient brings its own volatility on top.
    const volatility = note ? note.persistence : rand(0.7, 1.5);
    const max = clamp(360 * Math.pow(p.r, 1.5) * volatility, 700, 11000);
    const runs = p.r > 5.6 && Math.random() < 0.45;

    this.drops.push({
      x: p.tx,
      y: p.ty,
      r: p.r,
      r0: p.r,
      alpha: rand(0.45, 0.95),
      life: 0,
      max,
      runAt: runs ? rand(260, 1500) : Infinity,
      runDist: rand(16, 48) + p.r * 5,
      vy: 0,
      trail: 0,
      settle: 0,
      // Heavier drops sag on a vertical surface: taller than they are wide.
      squash: p.r > 3.5 ? rand(0.84, 0.95) : rand(0.94, 1.06),
      // Carried through from the particle: liquid nobody asked for, which is
      // drawn like any other but does not claim the drag. See isWetAt.
      passive: p.passive,
      ax: p.ax,
      color: p.color,
    });
    this.splats.push({ x: p.tx, y: p.ty, r: p.r, color: p.color, age: 0, life: 190, ax: p.ax });

    if (note) this._onLabel(note.name, p.tx + this.dx(p), p.ty, p.r, max);
  }

  /**
   * Name a droplet, if this one is a good candidate. Mid-sized only: the big
   * ones run and leave their text behind, the small ones are too faint to
   * anchor a word. Candidates must clear the impact centre, the top edge, and
   * anything already placed, or they land in a heap.
   */
  _pickLabel(p) {
    if (!this._labels.length || this._placed.length >= 4) return null;
    if (p.r < 2.2 || p.r > 6) return null;
    if (Math.random() > 0.65) return null;
    if (p.ty < this._bounds.h * 0.14) return null;
    if (Math.hypot(p.tx - this._origin.x, p.ty - this._origin.y) < 70) return null;
    if (this._placed.some((q) => Math.hypot(p.tx - q.x, p.ty - q.y) < 115)) return null;

    this._placed.push({ x: p.tx, y: p.ty });
    return this._labels.pop();
  }

  /**
   * Drops that touch pull into one, because surface tension does not tolerate
   * two beads sharing an edge. Quadratic, so it runs on a timer rather than
   * every frame, and capped so it cannot compound into a single blob.
   */
  _coalesce() {
    const list = this.drops;
    for (let i = list.length - 1; i > 0; i--) {
      const a = list[i];
      const ra = radiusOf(a);
      if (ra < 1 || a.r >= MAX_RADIUS) continue;

      for (let j = i - 1; j >= 0; j--) {
        const b = list[j];
        const rb = radiusOf(b);
        if (rb < 1 || b.r >= MAX_RADIUS) continue;
        // On contact, not near it — but not so eager that it chains. Compared
        // where they actually are, since two bursts fired from different points
        // on the table carry different anchors.
        const ax = this.screenX(a);
        const bx = this.screenX(b);
        if (Math.hypot(ax - bx, a.y - b.y) > (ra + rb) * 0.82) continue;

        const area = a.r * a.r + b.r * b.r;
        const wa = (a.r * a.r) / area;
        b.x = (bx * (1 - wa) + ax * wa) - this.dx(b);
        b.y = b.y * (1 - wa) + a.y * wa;
        b.r = Math.min(Math.sqrt(area), MAX_RADIUS);
        b.r0 = Math.max(b.r0, b.r);
        b.max = Math.max(a.max, b.max);
        b.life = Math.min(a.life, b.life) * 0.6;
        b.alpha = Math.max(a.alpha, b.alpha);
        b.squash = b.r > 3.5 ? rand(0.84, 0.95) : rand(0.94, 1.06);
        // Two beads snapping together ring before they settle.
        b.settle = 260;
        if (b.r > 5.6 && b.runAt === Infinity && Math.random() < 0.5) {
          b.runAt = b.life + rand(200, 900);
          b.runDist = rand(16, 48) + b.r * 5;
        }
        list.splice(i, 1);
        break;
      }
    }
  }

  step(dt, ms, h) {
    if (this.haze) {
      this.haze.age += ms;
      if (this.haze.age >= this.haze.life) this.haze = null;
    }

    this._mergeIn -= ms;
    if (this._mergeIn <= 0) {
      this._mergeIn = 90;
      if (this.drops.length > 1) this._coalesce();
    }

    for (let i = this.splats.length - 1; i >= 0; i--) {
      this.splats[i].age += ms;
      if (this.splats[i].age >= this.splats[i].life) this.splats.splice(i, 1);
    }

    for (let i = this.residues.length - 1; i >= 0; i--) {
      this.residues[i].life += ms;
      if (this.residues[i].life >= this.residues[i].max) this.residues.splice(i, 1);
    }

    for (let i = this.incoming.length - 1; i >= 0; i--) {
      const p = this.incoming[i];
      p.age += ms;
      if (p.age < p.delay) continue;
      if (p.age - p.delay >= p.dur) {
        if (!p.passes) this._land(p);
        this.incoming.splice(i, 1);
      }
    }

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life += ms;

      if (d.life >= d.max || d.y - d.r > h) {
        // What is left is the oil, which does not evaporate.
        if (d.r0 > 2.6 && d.life >= d.max) {
          this.residues.push({
            x: d.x,
            y: d.y,
            r: d.r * 0.72,
            color: d.color,
            life: 0,
            max: rand(1600, 3200),
            alpha: rand(0.05, 0.12),
            ax: d.ax,
          });
        }
        this.drops.splice(i, 1);
        continue;
      }

      if (d.settle > 0) d.settle = Math.max(0, d.settle - ms);

      if (d.life > d.runAt) {
        if (d.trail < d.runDist) {
          // Surface tension gives way; it accelerates and thins as it goes.
          d.vy += 0.03 * dt;
          d.r = Math.max(1.6, d.r - 0.008 * dt);
        } else {
          // It has shed enough volume to grip again, and stalls.
          d.vy *= Math.pow(0.9, dt);
          if (d.vy < 0.01) d.vy = 0;
        }
        d.y += d.vy * dt;
        d.trail += d.vy * dt;
      }
    }
  }

  /** Contact shadows. Drawn normally — the one part of the scene that darkens. */
  drawShadows(g) {
    for (const d of this.drops) {
      const rr = radiusOf(d);
      const a = d.alpha * alphaOf(d);
      if (a <= 0.02 || rr < 1.2) continue;

      g.globalAlpha = a * 0.34;
      g.fillStyle = "rgba(0,0,0,1)";
      g.beginPath();
      g.ellipse(this.screenX(d) + rr * 0.22, d.y + rr * 0.3, rr * 1.15, rr * 1.15, 0, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  /** Everything else, drawn additively. */
  draw(g, w, h) {
    if (this.haze) {
      const t = this.haze.age / this.haze.life;
      const hx = this.screenX(this.haze);
      const grad = g.createRadialGradient(
        hx, this.haze.y, 0,
        hx, this.haze.y, Math.max(w, h) * 0.75,
      );
      const a = (1 - t) * 0.2 * this.haze.power;
      grad.addColorStop(0, toRGBA(this.haze.color, a));
      grad.addColorStop(1, toRGBA(this.haze.color, 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }

    // Still in the air, rushing at the lens.
    for (const p of this.incoming) {
      if (p.age < p.delay) continue;
      const t = Math.min((p.age - p.delay) / p.dur, 1);
      const travelled = Math.pow(t, 1.7);
      const x = p.ox + (p.tx - p.ox) * travelled + this.dx(p);
      const y = p.oy + (p.ty - p.oy) * travelled;
      const size = (1.5 + Math.pow(t, 1.5) * p.r * 4.6) * (p.passes ? 1.7 : 1);
      const a = (t < 0.14 ? t / 0.14 : 1) * (p.passes ? 0.5 * (1 - t) : 0.42);
      if (a <= 0.004) continue;
      g.globalAlpha = a;
      g.drawImage(blob(p.color), x - size / 2, y - size / 2, size, size);
    }

    // What the liquid leaves behind.
    for (const res of this.residues) {
      const t = res.life / res.max;
      g.globalAlpha = res.alpha * (t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9);
      const size = res.r * 2.2;
      g.drawImage(roundDrop(res.color), this.screenX(res) - size / 2, res.y - size / 2, size, size);
    }
    g.globalAlpha = 1;

    for (const d of this.drops) {
      const rr = radiusOf(d);
      const a = d.alpha * alphaOf(d);
      if (a <= 0.004 || rr <= 0.05) continue;
      const dx = this.screenX(d);

      if (d.trail > 6) {
        // The smear is a thinner film than the drop, so it dries first.
        const evap = d.r > 0 ? rr / d.r : 0;
        const len = Math.min(d.trail, 96) * evap;
        const trail = g.createLinearGradient(dx, d.y - len, dx, d.y);
        trail.addColorStop(0, toRGBA(d.color, 0));
        trail.addColorStop(1, toRGBA(d.color, a * 0.34 * evap));
        g.fillStyle = trail;
        g.beginPath();
        g.moveTo(dx - rr * 0.16, d.y - len);
        g.lineTo(dx + rr * 0.16, d.y - len);
        g.lineTo(dx + rr * 0.44, d.y);
        g.lineTo(dx - rr * 0.44, d.y);
        g.closePath();
        g.fill();
      }

      g.globalAlpha = a;
      if (d.vy > 0.14) {
        const stretch = 1 + Math.min(d.vy * 0.5, 0.7);
        const s = rr / PENDANT.r;
        g.drawImage(
          pendantDrop(d.color),
          dx - PENDANT.cx * s,
          d.y - PENDANT.cy * s * stretch,
          PENDANT.w * s,
          PENDANT.h * s * stretch,
        );
      } else {
        const dw = rr * 2.4 * d.squash;
        const dh = (rr * 2.4) / d.squash;
        g.drawImage(roundDrop(d.color), dx - dw / 2, d.y - dh / 2, dw, dh);
      }
      g.globalAlpha = 1;
    }

    for (const s of this.splats) {
      const t = s.age / s.life;
      const size = s.r * (2.4 + t * 3.4);
      g.globalAlpha = (1 - t) * 0.5;
      g.drawImage(blob(s.color), this.screenX(s) - size / 2, s.y - size / 2, size, size);
    }
    g.globalAlpha = 1;
  }
}

export default Droplets;
