/** Editorial cart copy — calm, understated, brand-led. */

export function cartEditorialLine(compositionCount: number): string {
  if (compositionCount <= 0) return "Your selected fragrances.";
  if (compositionCount === 1) {
    return "One handcrafted composition reserved for you.";
  }
  return `${compositionCount} handcrafted compositions reserved for you.`;
}

export function cartItemCountLabel(itemCount: number): string {
  return `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
}
