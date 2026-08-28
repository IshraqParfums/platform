import { ButtonLink } from "@/components/ui/button";
import { BandInner } from "@/components/home-v2/ui/band";
import { SHOP } from "@/lib/content/shop";

/**
 * Soft exit from the shop catalogue — the quiz, not another catalogue.
 */
export function ShopClosingBand() {
  return (
    <section className="bg-paper-deep py-16 md:py-20 lg:py-24">
      <BandInner>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="max-w-[46ch]">
            <h2 className="font-editorial text-h3-editorial text-graphite">
              {SHOP.closing.heading}
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-graphite-soft">
              {SHOP.closing.lead}
            </p>
          </div>

          <ButtonLink href="/bespoke" variant="ink" size="pill">
            {SHOP.closing.cta}
          </ButtonLink>
        </div>
      </BandInner>
    </section>
  );
}
