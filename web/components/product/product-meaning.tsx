import type { ProductIdentity, ProductMeaningStory } from "@ishraqparfums/shared";
import { Reveal } from "@/components/ui/reveal";

/**
 * "What the name means" — the identity/pronunciation caption plus the
 * meaning-story heading and body (with an optional translation underneath).
 */
export function ProductMeaning({
  identity,
  meaningStory,
}: {
  identity: ProductIdentity | null;
  meaningStory: ProductMeaningStory | null;
}) {
  if (!meaningStory) return null;

  const caption = [
    identity?.pronunciation ? `"${identity.pronunciation}"` : null,
    identity?.meaning ? `"${identity.meaning}"` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Reveal>
      <div className="border-t border-graphite/10 pt-6">
        <p className="text-[13px] text-terra">What the name means</p>
        <h2 className="mt-3 font-editorial text-h3-editorial text-graphite">
          {meaningStory.heading}
        </h2>
        {caption ? (
          <p className="mt-2 text-[13px] text-graphite-faint">{caption}</p>
        ) : null}

        <div className="mt-4 max-w-prose space-y-3 text-[15px] leading-[1.65] text-graphite-soft">
          {meaningStory.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {meaningStory.bodyTranslation &&
        meaningStory.bodyTranslation.length > 0 ? (
          <div className="mt-3 max-w-prose space-y-2 text-[14px] italic leading-[1.6] text-graphite-faint">
            {meaningStory.bodyTranslation.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </div>
    </Reveal>
  );
}
