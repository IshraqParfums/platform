type ClassValue = string | false | null | undefined;

/** Minimal class joiner — avoids a dependency for what is a three-line need. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
