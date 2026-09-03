import type { ProductOlfactoryProfile } from "@ishraqparfums/shared";
import { RecordSection } from "@/components/product-v2/ui/record";

/** "VERY_LONG" → "Very long". */
function humanize(value: string): string {
  const spaced = value.toLowerCase().split("_").join(" ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * "How it smells" — the first answer, in plain English.
 *
 * This is the section for someone who doesn't read note pyramids, so it
 * comes before them and it leads with the two things that actually answer
 * the question: what family it belongs to, and what it feels like. Those get
 * real size.
 *
 * Everything else — when to wear it, how long it lasts — follows as quiet
 * supporting facts. Previously this content was seven bordered capsules
 * tacked onto the end of the notes section, which made the page's most
 * useful plain-language block read as a footnote.
 */
export function ProductSmellsChapter({
  olfactoryProfile,
  hideKicker,
}: {
  olfactoryProfile: ProductOlfactoryProfile | null;
  /** Omit the "How it smells" title when a wrapping row already shows it. */
  hideKicker?: boolean;
}) {
  if (!olfactoryProfile) return null;

  const {
    family,
    character,
    season,
    occasion,
    intensity,
    sillage,
    longevity,
  } = olfactoryProfile;

  const facts = [
    season.length > 0 ? { label: "Best in", value: season.join(", ") } : null,
    occasion.length > 0
      ? { label: "Wear it", value: occasion.join(", ") }
      : null,
    longevity ? { label: "Lasts", value: humanize(longevity) } : null,
    intensity ? { label: "Strength", value: humanize(intensity) } : null,
    sillage ? { label: "Trail", value: humanize(sillage) } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  if (!family && character.length === 0 && facts.length === 0) return null;

  return (
    <RecordSection kicker={hideKicker ? undefined : "How it smells"}>
      {family ? (
        <p className="font-editorial text-[clamp(24px,3vw,32px)] leading-[1.15] text-graphite">
          {family}
        </p>
      ) : null}

      {character.length > 0 ? (
        <p className="mt-3 max-w-[46ch] text-[17px] leading-[1.6] text-graphite">
          {character.join(" · ")}
        </p>
      ) : null}

      {facts.length > 0 ? (
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[13px] text-graphite-soft">{fact.label}</dt>
              <dd className="mt-1 text-[16px] leading-[1.5] text-graphite">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </RecordSection>
  );
}
