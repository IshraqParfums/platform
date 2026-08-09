/**
 * Small shared helpers.
 *
 * These were duplicated across the renderer, both spray engines and the
 * slider — four copies of the same colour parser and the same random helpers.
 * They live here so there is one of each.
 */

/**
 * Escape text bound for innerHTML. Everything user- or API-supplied goes
 * through this before it reaches the DOM.
 * @param {unknown} value
 */
export const esc = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]),
  );

/** @param {number} v @param {number} min @param {number} max */
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Uniform random in [a, b). */
export const rand = (a, b) => a + Math.random() * (b - a);

/**
 * Roughly normal, in [-1, 1]. Used wherever particles should cluster around a
 * centre instead of spreading evenly — cone spread, impact scatter.
 */
export const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/**
 * `#rgb` / `#rrggbb` to `rgba(...)` at the given alpha, so canvas gradients can
 * be built from the same theme colours the CSS uses. Anything that is not a hex
 * string is passed through untouched.
 * @param {string} color
 * @param {number} a
 */
export function toRGBA(color, a) {
  if (typeof color === "string" && color.charCodeAt(0) === 35) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const n = Number.parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  return color;
}
