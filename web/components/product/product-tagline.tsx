import type { ProductTagline } from "@ishraqparfums/shared";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { Reveal } from "@/components/ui/reveal";

/** Arabic-script block, covering Urdu/Nastaliq and its extended letterforms. */
const SCRIPT_PATTERN = /[؀-ۿݐ-ݿ]/;

/**
 * Bilingual tagline directly under the product name. `primary` may lead in
 * either language (a content choice, not fixed by the type) — this detects
 * which one it is and routes Urdu/Arabic script through the shared `Urdu`
 * component (for correct shaping/direction) rather than plain text.
 */
export function ProductTagline({
  tagline,
}: {
  tagline: ProductTagline | null;
}) {
  if (!tagline) return null;

  const isScripted = SCRIPT_PATTERN.test(tagline.primary);

  return (
    <Reveal>
      <div className="mt-2">
        {isScripted ? (
          <Urdu size="md" leading="loose">
            {tagline.primary}
          </Urdu>
        ) : (
          <p className="text-[17px] leading-[1.5] text-graphite">
            {tagline.primary}
          </p>
        )}
        {tagline.translation ? (
          <p className="mt-1 text-[14px] italic leading-[1.5] text-graphite-soft">
            {tagline.translation}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}
