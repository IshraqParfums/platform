/**
 * Spray engine.
 *
 * A canvas particle system tuned to behave like an atomiser rather than a
 * generic particle burst. Three things happen at once, and the overlap is what
 * makes it read as perfume rather than smoke:
 *
 *   jet      — a few hundred fast, tiny, bright droplets in a narrow cone.
 *              They carry a long way before drag kills them, which is what
 *              gives the spray its reach and its grain.
 *   mist     — slow, large, very low-alpha puffs that expand and rise. This is
 *              the body of the cloud; it lingers for a couple of seconds.
 *   fallout  — every droplet that dies has a chance of becoming a mist puff,
 *              so the cloud grows outward along the path the jet actually took
 *              instead of sitting in a ball at the nozzle.
 *
 * Everything is drawn additively, so density builds where particles overlap.
 */

const FRAME = 1000 / 60;
const TAU = Math.PI * 2;
const MAX_PARTICLES = 1800;

/** Soft radial sprites, cached per colour + hardness. */
const spriteCache = new Map();

function toRGBA(color, a) {
  if (typeof color === "string" && color.charCodeAt(0) === 35) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const n = Number.parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  return color;
}

/**
 * @param {string} color
 * @param {'core'|'soft'} kind  `core` is a tight droplet, `soft` is haze.
 */
function sprite(color, kind) {
  const key = `${kind}|${color}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;

  const size = 96;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const half = size / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);

  if (kind === "core") {
    grad.addColorStop(0, toRGBA(color, 1));
    grad.addColorStop(0.32, toRGBA(color, 0.72));
    grad.addColorStop(1, toRGBA(color, 0));
  } else {
    grad.addColorStop(0, toRGBA(color, 0.42));
    grad.addColorStop(0.32, toRGBA(color, 0.2));
    grad.addColorStop(1, toRGBA(color, 0));
  }

  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  spriteCache.set(key, c);
  return c;
}

const rand = (a, b) => a + Math.random() * (b - a);
/** Triangular distribution — clusters toward the middle of the cone. */
const spread = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

export class SprayEngine {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.emitters = [];
    this.flashes = [];
    this.running = false;
    this.last = 0;
    this.dpr = 1;
    this.w = 0;
    this.h = 0;
    this._loop = this._loop.bind(this);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.w = rect.width;
    this.h = rect.height;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Fire the atomiser.
   * @param {object} o
   * @param {number} o.x            Nozzle x, in canvas CSS pixels.
   * @param {number} o.y            Nozzle y, in canvas CSS pixels.
   * @param {string} o.color        Accent colour — the mist.
   * @param {string} [o.colorSoft]  Lighter accent — the droplets and flash.
   * @param {number} [o.angle]      Direction in radians. Default: slightly upward.
   * @param {number} [o.power]      0–1, scales count, velocity and reach.
   */
  spray({ x, y, color, colorSoft, angle = -0.16, power = 1 }) {
    const soft = colorSoft || color;
    this.emitters.push({
      x,
      y,
      color,
      soft,
      angle,
      power,
      life: 200 * (0.6 + power * 0.4),
      age: 0,
    });
    this.flashes.push({ x, y, color: soft, age: 0, life: 190 });
    this.start();
  }

  _drop(e) {
    const a = e.angle + spread() * 0.26;
    const speed = rand(9, 24) * e.power;
    this.particles.push({
      kind: "drop",
      x: e.x + rand(-1.2, 1.2),
      y: e.y + rand(-1.2, 1.2),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: rand(0.5, 1.9),
      life: 0,
      max: rand(420, 900),
      alpha: rand(0.45, 0.95),
      phase: Math.random() * TAU,
      color: e.soft,
      angle: e.angle,
      power: e.power,
      mist: e.color,
    });
  }

  _puff(e) {
    const a = e.angle + spread() * 0.44;
    const speed = rand(1.5, 8) * e.power;
    this.particles.push({
      kind: "mist",
      x: e.x + rand(-2, 2),
      y: e.y + rand(-2, 2),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: rand(5, 16),
      grow: rand(1.006, 1.016),
      life: 0,
      max: rand(1300, 2600),
      alpha: rand(0.035, 0.095),
      phase: Math.random() * TAU,
      color: e.color,
    });
  }

  /** A spent droplet hanging in the air as vapour. */
  _fallout(p) {
    this.particles.push({
      kind: "mist",
      x: p.x,
      y: p.y,
      vx: p.vx * 0.3,
      vy: p.vy * 0.3,
      r: rand(3, 9),
      grow: rand(1.008, 1.018),
      life: 0,
      max: rand(900, 1800),
      alpha: rand(0.03, 0.075),
      phase: Math.random() * TAU,
      color: p.mist,
    });
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
    this.particles.length = 0;
    this.emitters.length = 0;
    this.flashes.length = 0;
    if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
  }

  _loop(now) {
    if (!this.running) return;

    const raw = now - this.last;
    this.last = now;
    // Clamp so a backgrounded tab doesn't teleport every particle off-screen.
    const ms = Math.min(raw, 50);
    this._step(ms / FRAME, ms);
    this._draw();

    if (this.particles.length || this.emitters.length || this.flashes.length) {
      requestAnimationFrame(this._loop);
    } else {
      this.running = false;
      if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  _step(dt, ms) {
    const room = MAX_PARTICLES - this.particles.length;

    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const e = this.emitters[i];
      e.age += ms;
      const t = Math.min(e.age / e.life, 1);

      if (room > 0) {
        // Hardest at the start of the press, tapering as pressure drops.
        const drops = Math.round(30 * e.power * (1 - 0.65 * t) * dt);
        for (let n = 0; n < drops; n++) this._drop(e);
        const puffs = Math.round(6 * e.power * dt);
        for (let n = 0; n < puffs; n++) this._puff(e);
      }

      if (e.age >= e.life) this.emitters.splice(i, 1);
    }

    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].age += ms;
      if (this.flashes[i].age >= this.flashes[i].life) this.flashes.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += ms;

      if (p.life >= p.max) {
        if (p.kind === "drop" && Math.random() < 0.62 && this.particles.length < MAX_PARTICLES) {
          this._fallout(p);
        }
        this.particles.splice(i, 1);
        continue;
      }

      const drift = Math.sin(p.life / 240 + p.phase) * 0.06;

      if (p.kind === "drop") {
        const d = Math.pow(0.955, dt);
        p.vx *= d;
        p.vy *= d;
        p.vy += 0.05 * dt; // gravity pulls the heavier droplets down
        p.vx += drift * dt;
      } else {
        const d = Math.pow(0.972, dt);
        p.vx *= d;
        p.vy *= d;
        p.vy -= 0.018 * dt; // scent rises
        p.vx += drift * 2.2 * dt;
        p.r *= Math.pow(p.grow, dt);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  _draw() {
    const g = this.ctx;
    if (!this.w) return;

    g.clearRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = "lighter";

    // Mist first so the droplets sparkle on top of it.
    for (let pass = 0; pass < 2; pass++) {
      const want = pass === 0 ? "mist" : "drop";

      for (const p of this.particles) {
        if (p.kind !== want) continue;

        const t = p.life / p.max;
        const fadeIn = p.kind === "drop" ? 0.06 : 0.16;
        // Droplets fall off harder than mist, so the far edge of the cone
        // dissolves into haze instead of staying a field of bright specks.
        const falloff = p.kind === "drop" ? 1.9 : 1.3;
        const env = t < fadeIn ? t / fadeIn : Math.pow(1 - (t - fadeIn) / (1 - fadeIn), falloff);
        const a = p.alpha * env;
        if (a <= 0.003) continue;

        const d = p.kind === "drop" ? Math.max(1.6, p.r * 2.4) : p.r * 4.6;
        g.globalAlpha = a;
        g.drawImage(sprite(p.color, p.kind === "drop" ? "core" : "soft"), p.x - d / 2, p.y - d / 2, d, d);
      }
    }

    // Pressure flash at the orifice.
    for (const f of this.flashes) {
      const t = f.age / f.life;
      g.globalAlpha = (1 - t) * 0.75;
      const d = 12 + t * 26;
      g.drawImage(sprite(f.color, "core"), f.x - d / 2, f.y - d / 2, d, d);
    }

    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  }

  destroy() {
    this.stop();
    this.clear();
  }
}

export default SprayEngine;
