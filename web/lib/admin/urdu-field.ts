import { isUrduScript } from "@ishraqparfums/shared";

export const URDU_FIELD_PROPS = {
  dir: "rtl" as const,
  lang: "ur",
};

export function urduIfPresent(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isUrduScript(trimmed)) {
    return `${label} must be written in Urdu.`;
  }
  return null;
}
