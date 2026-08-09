/**
 * Oil — what a glass rod leaves on the glass.
 *
 * An attar is drawn on, not sprayed. Oil off a rod is far too viscous to break
 * into droplets and it wets the surface rather than beading on it, so what you
 * get is a fine wide line that creeps a little at its edges and then stays.
 *
 * Two things this has to get right that a plain stroked path cannot:
 *
 *   width   — a rod lays down a thick line when it is moved slowly and a thin
 *             one when it is moved fast, and it tapers off at both ends. That
 *             is per-point, so the mark is a filled ribbon built from the path,
 *             not a constant-width stroke along it.
 *   opacity — a film is a film. Stroking the same path more than once, or
 *             drawing it additively, piles intensity onto the same pixels and
 *             the line darkens into a painted stripe every time the hand
 *             crosses itself. The ribbon is filled exactly once, in
 *             source-over, so passing over the same spot changes nothing.
 *
 * The wet read comes from the rim, not from the body: oil piles up where the
 * film meets dry glass, and that bright boundary is most of what your eye uses
 * to tell a wet mark from a drawn one.
 */

import { clamp, rand, toRGBA } from "../util.js";
import { segmentDistance } from "./sprites.js";

/** Below this the point is a duplicate and carries no direction. */
const MIN_STEP = 2.5;

/** Above this a gap gets filled in. See `to`. */
const MAX_STEP = 13;

/** Cap on stored points. A stroke this long has left the visible glass twice. */
const MAX_POINTS = 600;

/**
 * Speed, in px between samples, at which the rod draws its thinnest line.
 *
 * Generous on purpose. A hand crossing the glass moves 20–40px between pointer
 * events, so a threshold anywhere near that puts every ordinary stroke at the
 * floor — and the mark comes out as a thin line no matter how it was drawn.
 * The speed here is meant to vary the width, not to decide it.
 */
const FAST = 95;

/** The thinnest a stroke goes, as a fraction of the rod's full width. */
const THINNEST = 0.58;

export class Oil {
  constructor() {
    /** @type {object[]} */
    this.strokes = [];
    this._active = null;
    /** Where the bottle this came off is now. See Droplets#anchor. */
    this.anchor = 0;
  }

  /** How far a stroke has travelled since it was drawn. */
  dx(s) {
    return this.anchor - s.ax;
  }

  isEmpty() {
    return this.strokes.length === 0;
  }

  hasLiquid() {
    return this.strokes.length > 0;
  }

  /** Is there oil right here? Used to decide whether a gesture wipes. */
  isWetAt(x, y, reach = 80) {
    for (const s of this.strokes) {
      const dx = this.dx(s);
      for (const p of s.points) {
        if (Math.hypot(p.x + dx - x, p.y - y) < reach + p.w) return true;
      }
    }
    return false;
  }

  clear() {
    this.strokes.length = 0;
    this._active = null;
  }

  /**
   * Start a stroke.
   * @param {object} o
   * @param {string} o.color
   * @param {string} [o.colorSoft]
   * @param {number} [o.width] Widest the rod will draw, in canvas pixels.
   */
  begin({ color, colorSoft, width = 30 }) {
    this._active = {
      points: [],
      width,
      color,
      edge: colorSoft || color,
      active: true,
      life: 0,
      max: rand(19000, 27000),
      alpha: rand(0.2, 0.28),
      // How far the edges creep outward once it has been laid down.
      creep: rand(1.1, 1.26),
      ax: this.anchor,
    };
    this.strokes.push(this._active);
    // More than a handful of strokes is soup, and each one costs three blurred
    // fills a frame.
    while (this.strokes.length > 4) this.strokes.shift();
  }

  /**
   * Continue the current stroke.
   *
   * Long gaps get filled in. A pointer moving quickly reports every 30–50px,
   * and a ribbon built straight from those samples is a chain of straight
   * segments with visible corners at every joint — which is exactly what a
   * stroke of oil is not. Filling the gaps gives the curve enough points to
   * bend through and the width enough steps to ease across.
   */
  to(screenX, y) {
    const s = this._active;
    if (!s || !s.active) return;

    // Points are kept in the stroke's own frame, so the whole mark travels
    // with its bottle even if the collection moves mid-stroke.
    const x = screenX - this.dx(s);

    const last = s.points[s.points.length - 1];
    if (!last) {
      s.points.push({ x, y, w: s.width * 0.8 });
      return;
    }

    const step = Math.hypot(x - last.x, y - last.y);
    if (step < MIN_STEP) return;

    // Slow hand, fat line: the rod has time to let go of more oil. The floor
    // is high because this is meant to vary the width, not to set it.
    const speed = clamp(1 - step / FAST, THINNEST, 1);
    const target = s.width * speed;

    const fill = Math.min(Math.ceil(step / MAX_STEP), 8);
    for (let i = 1; i <= fill; i++) {
      const u = i / fill;
      s.points.push({
        x: last.x + (x - last.x) * u,
        y: last.y + (y - last.y) * u,
        // Ease toward the new width so a jittery pointer cannot corrugate the
        // edge, and so a gap does not step.
        w: last.w + (target - last.w) * (0.4 * u + 0.6 * u * u),
      });
    }
    while (s.points.length > MAX_POINTS) s.points.shift();
  }

  /** Lift the rod. */
  end() {
    if (this._active) this._active.active = false;
    this._active = null;
  }

  /**
   * Thin every stroke a wipe passes over.
   *
   * Oil does not lift off cleanly. A pass hurries it along its own lifetime
   * rather than removing it, so a second pass is what actually finishes it.
   *
   * @returns {?string} A colour, if anything was touched, for the wipe's smear.
   */
  wipeAlong(x1, y1, x2, y2, reach) {
    let color = null;
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      if (s.active) continue; // still being drawn

      const dx = this.dx(s);
      let touched = false;
      for (const p of s.points) {
        if (segmentDistance(p.x + dx, p.y, x1, y1, x2, y2) < reach + p.w) {
          touched = true;
          break;
        }
      }
      if (!touched) continue;

      color = color || s.edge;
      s.life = Math.max(s.life, s.max * 0.55) + s.max * 0.2;
      if (s.life >= s.max) this.strokes.splice(i, 1);
    }
    return color;
  }

  step(ms) {
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      if (s.active) continue; // a stroke still being drawn does not age
      s.life += ms;
      if (s.life >= s.max) this.strokes.splice(i, 1);
    }
  }

  /**
   * Trace the ribbon: down one side of the path and back up the other.
   *
   * Half-widths taper to nothing over the first and last few points, so the
   * mark starts and finishes at a point the way a rod lifting off does.
   */
  _ribbon(g, s, scale, off = 0) {
    const pts = s.points;
    const n = pts.length;
    const taper = Math.min(4, Math.floor(n / 3));

    /**
     * Half-width at i, narrowed at both ends.
     *
     * It stops at 0.4, not at zero. A rod touching down and lifting off leaves
     * a blunt end; run the taper all the way out and the mark finishes in a
     * hairline spike, which reads as a feather rather than a stroke of oil.
     */
    const half = (i) => {
      let t = 1;
      if (taper > 0) {
        if (i < taper) t = (i + 1) / (taper + 1);
        else if (i >= n - taper) t = (n - i) / (taper + 1);
        t = 0.4 + 0.6 * t;
      }
      return (pts[i].w * scale * t) / 2;
    };

    /** Unit normal at i, from the neighbours so corners stay square. */
    const normal = (i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: -dy / len, y: dx / len };
    };

    /** The offset point at i, on the given side, shifted across by `off`. */
    const edge = (i, side) => {
      const p = pts[i];
      const nv = normal(i);
      const h = off + half(i) * side;
      return { x: p.x + nv.x * h, y: p.y + nv.y * h };
    };

    /**
     * Walk one side, curving through the offsets rather than joining them with
     * straight lines. Each offset becomes a control point and the curve passes
     * through the midpoints between them, so the edge stays smooth however
     * coarsely the pointer was sampled.
     */
    const side = (from, to, step, first) => {
      let prev = edge(from, first ? 1 : -1);
      if (first) g.moveTo(prev.x, prev.y);
      else g.lineTo(prev.x, prev.y);

      for (let i = from + step; i !== to; i += step) {
        const cur = edge(i, first ? 1 : -1);
        g.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
        prev = cur;
      }
      const last = edge(to, first ? 1 : -1);
      g.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    };

    g.beginPath();
    side(0, n - 1, 1, true);
    side(n - 1, 0, -1, false);
    g.closePath();
  }

  /**
   * Draw every stroke. Expects source-over: this is a film lying on the glass,
   * not light being added to it, and compositing it additively is what turns a
   * crossed stroke into a bright welt.
   *
   * Nothing here is outlined. A stroked rim gives the mark a border, and a
   * border is the one thing a film of oil does not have — it reads as a drawn
   * shape immediately. What makes it read as liquid instead is three soft
   * layers and no hard edge anywhere:
   *
   *   film     the body, blurred at its own scale, so it thins away at the
   *            sides the way a spread film actually does
   *   gleam    a narrower band pushed to the lit side — the broad sheen off a
   *            curved wet surface
   *   specular a tight white core inside the gleam, which is the highlight
   *            itself and is what makes it look wet rather than merely shiny
   *
   * Each band is a single filled path, so a stroke crossing itself does not
   * pile up; two separate strokes crossing do, which is correct — that is
   * twice the oil.
   */
  draw(g) {
    for (const s of this.strokes) {
      if (s.points.length < 2) continue;

      const t = s.life / s.max;
      // It creeps outward for the first stretch, then holds.
      const creep = 1 + (s.creep - 1) * Math.min(1, s.life / 2600);
      const fade = t > 0.55 ? 1 - ((t - 0.55) / 0.45) * 0.92 : 1;
      if (fade <= 0.01) continue;

      const w = s.width * creep;

      // Shifted rather than re-projected: the stroke rides with its bottle.
      g.save();
      g.translate(this.dx(s), 0);

      g.filter = `blur(${(w * 0.17).toFixed(2)}px)`;
      this._ribbon(g, s, creep);
      g.globalAlpha = s.alpha * fade * 0.95;
      g.fillStyle = toRGBA(s.color, 1);
      g.fill();

      g.filter = `blur(${(w * 0.11).toFixed(2)}px)`;
      this._ribbon(g, s, creep * 0.4, -w * 0.19);
      // Capped well short of opaque. A film you cannot see through is not a
      // film — the background showing past it is most of why it reads as oil
      // rather than as a stroke of light.
      g.globalAlpha = Math.min(0.6, s.alpha * fade * 1.9);
      g.fillStyle = toRGBA(s.edge, 1);
      g.fill();

      g.filter = `blur(${Math.max(0.6, w * 0.05).toFixed(2)}px)`;
      this._ribbon(g, s, creep * 0.1, -w * 0.23);
      g.globalAlpha = fade * 0.24;
      g.fillStyle = "rgba(255,255,255,1)";
      g.fill();

      g.restore();
    }

    g.globalAlpha = 1;
    g.filter = "none";
  }
}

export default Oil;
