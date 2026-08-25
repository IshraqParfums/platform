import { Band, BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ButtonLink } from "@/components/ui/button";
import { HOME_HOUSE } from "@/lib/content/home-v2";

/**
 * The closing statement. The only place the Urdu is set at display size:
 * اشراق is the brand name in its own script, and running it large here is
 * the bilingual treatment resolving rather than repeating.
 */
export function HouseNote() {
  return (
    <Band space="spacious">
      <BandInner>
        <div className="mx-auto max-w-[720px] text-center">
          <Urdu size="display" align="center">
            {HOME_HOUSE.urdu}
          </Urdu>

          <p className="mt-3.5 font-editorial text-h3-editorial text-graphite text-pretty">
            {HOME_HOUSE.statement}
          </p>

          <p className="mt-6 text-[16px] leading-[1.65] text-graphite-soft text-pretty sm:text-[17px]">
            {HOME_HOUSE.body}
          </p>

          <div className="mt-11 flex flex-col items-stretch justify-center gap-3.5 min-[420px]:flex-row min-[420px]:items-center">
            <ButtonLink
              href={HOME_HOUSE.primaryCta.href}
              variant="graphite"
              size="pill"
            >
              {HOME_HOUSE.primaryCta.label}
            </ButtonLink>
            <ButtonLink
              href={HOME_HOUSE.secondaryCta.href}
              variant="outline-ink"
              size="pill"
            >
              {HOME_HOUSE.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </BandInner>
    </Band>
  );
}
