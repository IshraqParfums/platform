import type { ProductIdentity, ProductMeaningStory } from "@ishraqparfums/shared";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { RecordSection } from "@/components/product-v2/ui/record";

/**
 * "The name" — pronunciation, meaning, and why it's called that.
 *
 * The caption opens the section rather than sitting up in the arrival: said
 * here, "Shikasta · shi-KAS-ta · Broken" is the topic sentence for the story
 * that follows, instead of a stray line under a cart button.
 *
 * The heading is a step down from the arrival's `h1` on purpose — this is a
 * section, not a second hero, and at its previous `clamp(28px…46px)` it was
 * competing with the product name itself.
 */
export function ProductNameChapter({
  identity,
  meaningStory,
}: {
  identity: ProductIdentity | null;
  meaningStory: ProductMeaningStory | null;
}) {
  if (!meaningStory) return null;

  const caption = [identity?.pronunciation, identity?.meaning]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <RecordSection kicker="The name">
      {caption ? (
        <p className="font-editorial text-[17px] italic text-graphite-soft">
          {caption}
        </p>
      ) : null}

      <h2 className="mt-3 font-editorial text-[clamp(24px,3.2vw,36px)] leading-[1.15] tracking-[-0.01em] text-graphite">
        {meaningStory.heading}
      </h2>

      <div className="mt-6 space-y-4 text-[16px] leading-[1.7] text-graphite">
        {meaningStory.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {meaningStory.bodyTranslation && meaningStory.bodyTranslation.length > 0 ? (
        <div className="mt-5 space-y-3">
          {meaningStory.bodyTranslation.map((paragraph, i) => (
            <Urdu key={i} size="sm" tone="brass-deep" leading="loose">
              {paragraph}
            </Urdu>
          ))}
        </div>
      ) : null}
    </RecordSection>
  );
}
