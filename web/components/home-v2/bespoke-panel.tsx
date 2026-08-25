import { BESPOKE_PAISE_PER_ML } from "@ishraqparfums/shared";
import Link from "next/link";
import { Band, BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { HOME_BESPOKE } from "@/lib/content/home-v2";
import { formatPaise } from "@/lib/format/money";

const { card } = HOME_BESPOKE;

/**
 * The bespoke pitch, with a working mock of the quiz's opening question beside
 * it. Showing the first question is the argument: it demonstrates that none of
 * them are about perfume, which is the thing that makes people start.
 *
 * Numbered how-it-works steps are omitted on purpose. The card is the
 * explanation. The price line is derived from `BESPOKE_PAISE_PER_ML` so a
 * pricing change cannot leave a stale number here.
 */
export function BespokePanel() {
  const bottlePrice = formatPaise(BESPOKE_PAISE_PER_ML * 100);

  return (
    <Band tone="paper-deep" space="default" className="mt-0">
      <BandInner>
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:pt-4">
            <Urdu size="lg" tone="brass-deep">
              {HOME_BESPOKE.urdu}
            </Urdu>

            <h2 className="mt-1 pb-1 font-editorial text-h2-editorial leading-[1.12] text-graphite">
              {HOME_BESPOKE.headlineLead}
              <br />
              <em className="italic">{HOME_BESPOKE.headlineEmphasis}</em>
            </h2>

            <p className="mt-5 max-w-[440px] text-[16px] leading-[1.6] text-graphite-soft text-pretty sm:text-[17px]">
              {HOME_BESPOKE.lead}
            </p>
          </div>

          {/* The whole card is one link. The answer tiles look selectable but
              are not: picking here and then being asked again on the quiz page
              would be worse than not offering the choice. */}
          <Link
            href={card.cta.href}
            className="group block rounded-[4px] border border-graphite/10 bg-shell p-7 transition-colors duration-200 hover:border-graphite/20 sm:p-10 lg:px-10 lg:py-11"
          >
            <div className="flex items-baseline justify-between font-ui text-micro font-semibold uppercase text-graphite-mute">
              <span>{card.label}</span>
              <span>{card.step}</span>
            </div>

            <div
              aria-hidden="true"
              className="mt-3.5 h-0.5 rounded-sm bg-graphite/[0.09]"
            >
              <div
                className="h-full rounded-sm bg-indigo"
                style={{ width: `${(card.progress * 100).toFixed(1)}%` }}
              />
            </div>

            <p className="mt-8 font-editorial text-h3-editorial text-graphite">
              {card.question}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {card.answers.map((answer, i) => (
                <div
                  key={answer}
                  className="grid grid-cols-[20px_1fr] gap-3 rounded-[3px] border border-graphite/[0.14] px-4 py-4 transition-colors duration-200 group-hover:border-graphite/20 sm:px-[18px] sm:py-5"
                >
                  <span className="font-ui text-[11px] font-semibold text-graphite-faint">
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-[1.45] text-graphite">
                    {answer}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-[72px_1fr] items-center gap-5 border-t border-graphite/10 pt-7 sm:grid-cols-[96px_1fr] sm:gap-[22px]">
              {/* A bottle of juice, rendered rather than photographed: the
                  blend does not exist yet, so a photograph would be a lie. */}
              <div
                aria-hidden="true"
                className="relative h-[100px] overflow-hidden rounded-[3px] sm:h-[118px]"
                style={{
                  background:
                    "linear-gradient(to top, #8a5a24, #c99a4e 46%, #e6cfa6)",
                }}
              />

              <div>
                <p className="font-ui text-micro font-semibold uppercase text-graphite-mute">
                  {card.outcomeLabel}
                </p>
                <p className="mt-2 text-[18px] leading-[1.4] text-graphite sm:text-[19px]">
                  {card.outcome}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center justify-center rounded-full bg-indigo px-7 py-3.5 font-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-shell transition-colors duration-200 group-hover:bg-indigo-deep">
                    {card.cta.label}
                  </span>
                  <span className="text-[13px] text-graphite-soft">
                    100 ml · {bottlePrice}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </BandInner>
    </Band>
  );
}
