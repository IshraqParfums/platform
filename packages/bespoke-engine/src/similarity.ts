/** Pure vector math shared by the (server-only) accord matcher and the
 * (client-safe) catalogue cross-sell ranking. No data imports — safe
 * anywhere. */

import { DIMENSIONS, type Fingerprint } from "./types.js";

export function cosineSimilarity(a: Fingerprint, b: Fingerprint): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const dim of DIMENSIONS) {
    dot += a[dim] * b[dim];
    magA += a[dim] * a[dim];
    magB += b[dim] * b[dim];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function cosineDistance(a: Fingerprint, b: Fingerprint): number {
  return 1 - cosineSimilarity(a, b);
}
