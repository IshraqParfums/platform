"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BandInner } from "@/components/home-v2/ui/band";
import { cn } from "@/lib/cn";
import { HOME_BESPOKE } from "@/lib/content/home-v2";

const { card } = HOME_BESPOKE;

/**
 * The bespoke pitch, with the engine's real opening question beside it.
 * Unlike the mock this replaced, choosing an option here actually answers it
 * — the visitor lands on the quiz's real second question, not a restart.
 */
export function BespokeEntry() {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function choose(optionId: string) {
    if (pendingId) return;
    setPendingId(optionId);
    try {
      const listRes = await fetch("/api/bespoke/sessions");
      if (listRes.ok) {
        const body = (await listRes.json()) as {
          sessions?: { sessionId: string }[];
        };
        if (Array.isArray(body.sessions) && body.sessions.length > 0) {
          router.push("/bespoke/quiz");
          return;
        }
      }
      const res = await fetch("/api/bespoke/quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) throw new Error("quick-start failed");
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/bespoke/quiz?s=${sessionId}`);
    } catch {
      router.push("/bespoke/quiz");
    }
  }

  /**
   * Lighter top padding than bottom: Collection right above already closes
   * with its own `pb-20 md:pb-28` on paper, so stacking a full baseline here
   * too would repeat the Materials/Collection over-padding, just with a
   * colour change hiding it less. Bottom keeps the full baseline — Belief's
   * closing statement below sets its own generous top rhythm independently.
   *
   * `id` stays as a stable in-page landmark for the teaser. The hero's
   * primary CTA goes to `/bespoke` rather than jumping here.
   */
  return (
    <section
      id="consultation"
      className="scroll-mt-20 bg-paper pt-10 pb-20 md:pt-14 md:pb-28 lg:pt-16"
    >
      <BandInner>
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:pt-4">
            <p className="text-[13px] text-terra">{HOME_BESPOKE.kicker}</p>
            <h2 className="mt-3 max-w-[16ch] font-editorial text-h2-editorial text-graphite">
              {HOME_BESPOKE.heading}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.6] text-graphite-soft">
              {HOME_BESPOKE.lead}
            </p>

            {/*
              Type, not furniture. This block went through a `border-t` on
              every row (three full-measure hairlines trailing off past
              labels half that long) and then a ruled spine with tick marks,
              and both failed the same way: hairlines are the thinnest mark
              on the page, and three of them cannot hold a column this size.
              Nothing here was ever going to read as substantial while the
              only things in it were 1px lines and 15px labels.

              So the weight comes from the numerals instead. Set in the
              editorial serif at terra, they are the one element in this
              column with real presence, and the serif-figure-against-sans-
              label pairing is the page's own contrast rather than a device
              borrowed for this one list. One hairline above the group,
              doing an actual job (closing the lead, opening the steps),
              replaces the four that were doing none.
            */}
            <ol className="mt-9 max-w-[34ch] space-y-6 border-t border-graphite/12 pt-7">
              {HOME_BESPOKE.steps.map((step, i) => (
                <li key={step} className="flex items-baseline gap-5">
                  <span className="font-editorial text-[26px] leading-none text-terra">
                    {i + 1}
                  </span>
                  <span className="text-[16px] font-medium leading-[1.5] text-graphite">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* A tinted lift, not an outline. The card is the one object on
              this section that the visitor can act on, and a hairline box
              reads as a container; a shadow toned to the paper underneath
              reads as something lying on it. */}
          <div className="rounded-[4px] border border-graphite/10 bg-shell p-7 shadow-[0_18px_44px_-30px_rgba(22,19,16,0.42)] sm:p-10 lg:px-10 lg:py-11">
            <div className="flex items-baseline justify-between font-ui text-micro font-semibold uppercase text-graphite-mute">
              <span>{card.label}</span>
              <span>{card.step}</span>
            </div>

            {/* The bar advances the moment an option is taken. It is the
                card's only moving part, and it earns it: the answer really
                does start a session and open question two, so this shows
                the choice registering instead of leaving the card frozen
                while the route changes underneath it. */}
            <div
              aria-hidden="true"
              className="mt-3.5 h-0.5 rounded-sm bg-graphite/[0.09]"
            >
              <div
                className="h-full rounded-sm bg-terra transition-[width] duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)]"
                style={{
                  width: `${((pendingId ? card.progressAnswered : card.progress) * 100).toFixed(1)}%`,
                }}
              />
            </div>

            <p className="mt-8 font-editorial text-h3-editorial text-graphite">
              {card.question}
            </p>

            {/*
              Hover, as this page draws it. The old state was
              `border-graphite/30` over a 2% graphite wash, which is below
              the threshold of being noticed at all — three answers that
              looked like disabled form rows. The replacement is built from
              the surface's own vocabulary rather than from a component
              library: a terra rule rising up the left edge (the Materials
              elbow, straightened), the answer stepping aside to make room
              for it, and a warm wash in the one accent colour this page
              actually uses. No chevron: nothing else on the paper surface
              uses an icon set, and importing one for three rows would
              break that.

              Every conflicting pair below is a ternary, never two classes
              appended. `cn()` is a plain join with no conflict resolution,
              so `scale-y-0` and `scale-y-100` in one string would be
              settled by stylesheet order rather than by state — the same
              trap that collapsed the hero's arch.
            */}
            <div className="mt-8 flex flex-col gap-3">
              {card.options.map((option, i) => {
                const isPending = pendingId === option.id;
                const isBlocked = pendingId !== null && !isPending;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => choose(option.id)}
                    disabled={pendingId !== null}
                    aria-busy={isPending}
                    className={cn(
                      "group relative grid w-full cursor-pointer grid-cols-[20px_1fr] items-start gap-3 overflow-hidden rounded-[3px] border px-4 py-4 text-left transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] disabled:pointer-events-none sm:px-[18px] sm:py-5",
                      isPending
                        ? "border-terra/45 bg-terra/[0.07]"
                        : "border-graphite/[0.14] hover:border-terra/35 hover:bg-terra/[0.045]",
                      isBlocked && "opacity-50",
                    )}
                  >
                    {/* Origin bottom, so it draws upward like the elbow in
                        Materials rather than dropping in from the top. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-y-0 left-0 w-[2px] origin-bottom bg-terra transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)]",
                        isPending ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100",
                      )}
                    />

                    <span
                      className={cn(
                        "font-ui text-[11px] font-semibold transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:translate-x-[3px]",
                        isPending ? "text-terra" : "text-graphite-faint group-hover:text-terra",
                      )}
                    >
                      {i + 1}
                    </span>

                    {/*
                      The label stays put while the request is in flight. It
                      used to be swapped for "Starting…", which threw away
                      the thing the visitor had just chosen at the exact
                      moment they were confirming it. The locked terra rule,
                      the wash and the advancing progress bar all say the
                      same thing without destroying the answer, and the
                      status below carries it to screen readers.
                    */}
                    <span className="text-[15px] leading-[1.45] text-graphite transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:translate-x-[3px]">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p role="status" className="sr-only">
              {pendingId ? "Starting your consultation" : ""}
            </p>
          </div>
        </div>
      </BandInner>
    </section>
  );
}
