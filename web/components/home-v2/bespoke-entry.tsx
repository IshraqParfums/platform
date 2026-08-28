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
      const res = await fetch("/api/bespoke/quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) throw new Error("quick-start failed");
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/bespoke/quiz?s=${sessionId}`);
    } catch {
      // Storefront must never dead-end on a marketing card — fall through to
      // a plain, unparameterized quiz start instead of stranding the visitor.
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
   * `id` is the hero's primary CTA target ("Discover your scent" points at
   * `#consultation` in HOME_HERO). Nothing on the page carried that anchor,
   * so the button did nothing when clicked. `scroll-mt` keeps the heading
   * clear of the fixed header once the smooth scroll lands.
   */
  return (
    <section
      id="consultation"
      className="scroll-mt-20 bg-paper-deep pt-10 pb-20 md:pt-14 md:pb-28 lg:pt-16"
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

            <ol className="mt-10 max-w-[46ch]">
              {HOME_BESPOKE.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-baseline gap-4 border-t border-graphite/10 py-4"
                >
                  <span className="font-ui text-[11px] font-semibold text-terra">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-semibold text-graphite">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[4px] border border-graphite/10 bg-shell p-7 sm:p-10 lg:px-10 lg:py-11">
            <div className="flex items-baseline justify-between font-ui text-micro font-semibold uppercase text-graphite-mute">
              <span>{card.label}</span>
              <span>{card.step}</span>
            </div>

            <div
              aria-hidden="true"
              className="mt-3.5 h-0.5 rounded-sm bg-graphite/[0.09]"
            >
              <div
                className="h-full rounded-sm bg-terra"
                style={{ width: `${(card.progress * 100).toFixed(1)}%` }}
              />
            </div>

            <p className="mt-8 font-editorial text-h3-editorial text-graphite">
              {card.question}
            </p>

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
                      "grid w-full grid-cols-[20px_1fr] items-start gap-3 rounded-[3px] border border-graphite/[0.14] px-4 py-4 text-left transition-colors duration-200 hover:border-graphite/30 hover:bg-graphite/[0.02] disabled:pointer-events-none sm:px-[18px] sm:py-5 cursor-pointer",
                      isPending && "border-terra/40 bg-terra/[0.04]",
                      isBlocked && "opacity-50",
                    )}
                  >
                    <span className="font-ui text-[11px] font-semibold text-graphite-faint">
                      {i + 1}
                    </span>
                    <span className="text-[15px] leading-[1.45] text-graphite">
                      {isPending ? "Starting…" : option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BandInner>
    </section>
  );
}
