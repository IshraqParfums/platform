import type { ReactNode } from "react";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";

/**
 * Shared shell for storefront static pages (privacy, terms, contact, …) —
 * kicker, title, optional meta/Urdu/description, then whatever body the
 * page supplies. Legal docs and the contact channel grid both fit the same
 * `width="form"` measure, so there's one shell instead of a per-page layout.
 */
export function StaticPage({
  kicker,
  title,
  description,
  meta,
  urdu,
  children,
  width = "form",
}: {
  kicker?: string;
  title: string;
  description?: string;
  /** e.g. effective date under the title. */
  meta?: string;
  /** Set only where a bilingual accent fits the page's register — skip it for legal copy. */
  urdu?: string;
  children: ReactNode;
  width?: "default" | "form";
}) {
  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner width={width}>
        <header className="max-w-2xl">
          {kicker ? (
            <p className="text-[12px] text-terra md:text-[13px]">{kicker}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-editorial text-[clamp(30px,4.2vw,42px)] leading-[1.04] text-graphite">
              {title}
            </h1>
            {urdu ? (
              <Urdu size="sm" tone="brass" align="start" leading="tight" as="span">
                {urdu}
              </Urdu>
            ) : null}
          </div>
          {meta ? (
            <p className="mt-3 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
              {meta}
            </p>
          ) : null}
          {description ? (
            <p className="mt-4 text-[15.5px] leading-relaxed text-graphite-soft">
              {description}
            </p>
          ) : null}
        </header>

        <div className="mt-10 md:mt-12">{children}</div>
      </BandInner>
    </section>
  );
}
