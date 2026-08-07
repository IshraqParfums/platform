/**
 * Deterministic seeded PRNG (mulberry32) for parity walks.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickIndex(rand: () => number, length: number): number {
  if (length <= 0) return 0;
  return Math.floor(rand() * length);
}
