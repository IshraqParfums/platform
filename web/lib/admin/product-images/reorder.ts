/**
 * Move an item one step in an ordered list. Returns null if the move is a no-op.
 */
export function moveItemInList<T>(
  items: T[],
  index: number,
  direction: -1 | 1,
): T[] | null {
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return null;
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (!item) return null;
  next.splice(nextIndex, 0, item);
  return next;
}
