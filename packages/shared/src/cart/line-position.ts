/**
 * Stable cart-line order. Positions are assigned at insert and never compacted
 * on delete, so Undo can recreate a line in the same slot (the gap is still
 * free). New adds take `max(position) + 1`.
 */
export function nextCartLinePosition(positions: Iterable<number>): number {
  let max = -1;
  for (const position of positions) {
    if (position > max) max = position;
  }
  return max + 1;
}

export function compareCartLinePosition(a: number, b: number): number {
  return a - b;
}

export function isCartLinePosition(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
