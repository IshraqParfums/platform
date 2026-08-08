/**
 * Sparkles.
 *
 * For the moment a perfume finishes its wear. Nine hours on skin is the best
 * thing a fragrance can tell you about itself, and it deserves to land as an
 * achievement rather than as an animation quietly stopping.
 *
 * Deliberately not the spray engine with a different colour. Mist is a cloud:
 * soft, additive, blurred, and it drifts. A sparkle is the opposite — a hard
 * little four-point star that flares, holds for a moment and snaps out, and the
 * twinkle is the whole effect. Trying to get one out of the other gives you a
 * poor version of both.
 */

const FRAME = 1000 / 60;
const TAU = Math.PI * 2;

const cache = new Map();

/**
 * A four-point star: two tapered spikes crossed, over a soft core.
 *
 * Drawn once per colour and scaled per particle. The long thin arms are what
 * make it read as a glint rather than a dot — a star with stubby arms is just
 * a diamond.
 */
function star(color) {
  const hit = cache.get(color);
  if (hit) return hit;

  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const h = size / 2;

  const glow = g.createRadialGradient(h, h, 0, h, h, h * 0.42);
  glow.addColorStop(0, color);
  glow.addColorStop(0.35, `${color}66`);
  glow.addColorStop(1, `${color}00`);
  g.fillStyle = glow;
  g.beginPath();
  g.arc(h, h, h * 0.42, 0, TAU);
  g.fill();

  // The spikes. Waisted at the middle so they taper to a point rather than
  // being triangles glued back to back.
  g.fillStyle = "#fff";
  for (const rot of [0, Math.PI / 2]) {
    g.save();
    g.translate(h, h);
    g.rotate(rot);
    g.beginPath();
    g.moveTo(0, -h);
    g.quadraticCurveTo(h * 0.07, -h * 0.1, h * 0.2, 0);
    g.quadraticCurveTo(h * 0.07, h * 0.1, 0, h);
    g.quadraticCurveTo(-h * 0.07, h * 0.1, -h * 0.2, 0);
    g.quadraticCurveTo(-h * 0.07, -h * 0.1, 0, -h);
    g.fill();
    g.restore();
  }

  cache.set(color, c);
  return c;
}

export class Sparkles {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.bits = [];
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.w = rect.width;
    this.h = rect.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Scatter sparkles across a box.
   *
   * Across, not from a point: this is celebrating a whole thing — a panel, a
   * badge — and a burst from one spot reads as an explosion rather than as
   * something catching the light all over.
   *
   * @param {object} o
   * @param {number} o.x Box in canvas CSS pixels.
   * @param {number} o.y
   * @param {number} o.w
   * @param {number} o.h
   * @param {string} o.color
   * @param {number} [o.count]
   */
  burst({ x, y, w, h, color, count = 26 }) {
    if (!this.w) this.resize();
    if (!this.w) return;

    for (let i = 0; i < count; i++) {
      this.bits.push({
        x: x + Math.random() * w,
        y: y + Math.random() * h,
        // Drifting up and barely sideways: they are catching light, not flying.
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.1 - Math.random() * 0.3,
        size: 7 + Math.random() * 17,
        // Staggered, so they come up in ones and twos instead of together.
        delay: Math.random() * 620,
        life: 0,
        max: 700 + Math.random() * 900,
        spin: (Math.random() - 0.5) * 0.004,
        angle: Math.random() * TAU,
        color,
      });
    }
    this.start();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
  }

  clear() {
    this.bits.length = 0;
    if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
  }

  _loop(now) {
    if (!this.running) return;
    const ms = Math.min(now - this.last, 50);
    this.last = now;
    const dt = ms / FRAME;

    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i];
      if (b.delay > 0) {
        b.delay -= ms;
        continue;
      }
      b.life += ms;
      if (b.life >= b.max) {
        this.bits.splice(i, 1);
        continue;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.spin * ms;
    }

    this._draw();

    if (this.bits.length) {
      requestAnimationFrame(this._loop);
    } else {
      this.running = false;
      if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  _draw() {
    const g = this.ctx;
    if (!this.w) return;
    g.clearRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = "lighter";

    for (const b of this.bits) {
      if (b.delay > 0) continue;
      const t = b.life / b.max;
      // Flare fast, hold, snap out. A symmetrical fade in and out reads as a
      // pulsing dot; the asymmetry is what makes it a glint.
      const a = t < 0.18 ? t / 0.18 : Math.pow(1 - (t - 0.18) / 0.82, 1.6);
      const size = b.size * (0.5 + a * 0.5);
      if (a <= 0.01) continue;

      g.save();
      g.globalAlpha = a;
      g.translate(b.x, b.y);
      g.rotate(b.angle);
      g.drawImage(star(b.color), -size / 2, -size / 2, size, size);
      g.restore();
    }

    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  }

  destroy() {
    this.stop();
    this.clear();
  }
}

export default Sparkles;
