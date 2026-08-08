/**
 * Cached sprites for anything drawn on the glass.
 *
 * Every shape here is baked once per colour and reused at any size. Building
 * gradients per particle per frame is the easiest way to make a few hundred
 * droplets expensive, and none of these shapes need to differ between
 * instances — only their scale does.
 */

import { toRGBA } from "../util.js";

const TAU = Math.PI * 2;
const cache = new Map();

/**
 * The lens gradient shared by the round and pendant drops.
 *
 * A droplet is not a bright disc. Light bends around its edge, so the rim is
 * bright, the body just inside it is nearly empty, and a small lensed point
 * sits at the centre where the background comes through magnified. That empty
 * middle is what stops it reading as a dot.
 */
function lensStops(grad, color) {
  grad.addColorStop(0, toRGBA(color, 0.14));
  grad.addColorStop(0.24, toRGBA(color, 0.04));
  grad.addColorStop(0.62, toRGBA(color, 0.02));
  grad.addColorStop(0.85, toRGBA(color, 0.58));
  grad.addColorStop(0.95, toRGBA(color, 0.88));
  grad.addColorStop(1, toRGBA(color, 0));
  return grad;
}

/** A drop at rest: round, hollow, bright-rimmed, one tight highlight. */
export function roundDrop(color) {
  const key = `round|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const h = size / 2;

  g.fillStyle = lensStops(g.createRadialGradient(h, h, 0, h, h, h), color);
  g.beginPath();
  g.arc(h, h, h, 0, TAU);
  g.fill();

  const spec = g.createRadialGradient(h * 0.66, h * 0.6, 0, h * 0.66, h * 0.6, h * 0.2);
  spec.addColorStop(0, "rgba(255,255,255,0.92)");
  spec.addColorStop(0.5, "rgba(255,255,255,0.35)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = spec;
  g.beginPath();
  g.arc(h * 0.66, h * 0.6, h * 0.2, 0, TAU);
  g.fill();

  cache.set(key, c);
  return c;
}

/**
 * A drop in motion: mass gathered at the leading edge, tapering to a tail.
 * 128 x 176, with the bulge centred at (64, 112) and a radius of 56.
 */
export const PENDANT = { w: 128, h: 176, cx: 64, cy: 112, r: 56 };

export function pendantDrop(color) {
  const key = `pendant|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const c = document.createElement("canvas");
  c.width = PENDANT.w;
  c.height = PENDANT.h;
  const g = c.getContext("2d");

  g.beginPath();
  g.moveTo(64, 40);
  g.bezierCurveTo(44, 74, 8, 92, 8, 112);
  g.arc(PENDANT.cx, PENDANT.cy, PENDANT.r, Math.PI, 0, false); // heavy bottom
  g.bezierCurveTo(120, 92, 84, 74, 64, 40);
  g.closePath();
  g.save();
  g.clip();

  g.fillStyle = lensStops(
    g.createRadialGradient(PENDANT.cx, PENDANT.cy, 0, PENDANT.cx, PENDANT.cy, PENDANT.r),
    color,
  );
  g.fillRect(0, 0, PENDANT.w, PENDANT.h);

  // A whisper down the tail, where the film is thin. Any more and it out-shines
  // the hollow bulge and the drop reads as a triangle.
  const tail = g.createLinearGradient(0, 62, 0, PENDANT.cy);
  tail.addColorStop(0, toRGBA(color, 0.1));
  tail.addColorStop(1, toRGBA(color, 0));
  g.fillStyle = tail;
  g.fillRect(0, 0, PENDANT.w, PENDANT.cy);
  g.restore();

  const spec = g.createRadialGradient(48, 98, 0, 48, 98, 12);
  spec.addColorStop(0, "rgba(255,255,255,0.9)");
  spec.addColorStop(0.5, "rgba(255,255,255,0.32)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = spec;
  g.beginPath();
  g.arc(48, 98, 12, 0, TAU);
  g.fill();

  cache.set(key, c);
  return c;
}

/** Out-of-focus blob, for mist still in the air on its way to the lens. */
export function blob(color) {
  const key = `blob|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 96;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const h = size / 2;
  const grad = g.createRadialGradient(h, h, 0, h, h, h);
  grad.addColorStop(0, toRGBA(color, 0.5));
  grad.addColorStop(0.4, toRGBA(color, 0.22));
  grad.addColorStop(1, toRGBA(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);

  cache.set(key, c);
  return c;
}

/** Shortest distance from a point to a line segment. */
export function segmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
