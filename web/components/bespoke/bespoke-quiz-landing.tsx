"use client";

import type { BespokeSessionViewResponse } from "@ishraqparfums/shared";
import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * One door, not a dashboard.
 *
 * This used to list every unfinished and every finished-unclaimed session on
 * the device with a Continue/Abandon pair per row — a consultations inbox in
 * front of what is supposed to read as a single conversation. The fix here
 * is presentation only: it picks the ONE session that matters (the most
 * recent unfinished one, or failing that the most recent finished-unclaimed
 * one) and asks a single question about it. `unfinished`/`finished` still
 * arrive as full lists from `useBespokeSessions` — the backend still tracks
 * every session on the device — this component just stops rendering that
 * list as UI.
 *
 * A real fix (one live session per device, replacing rather than
 * accumulating on each `create`) is a cookie/BFF change, not a component
 * one, and is out of scope here. What's below is the honest frontend half:
 * whatever the device is holding, the visitor is offered one clear choice.
 */
export function BespokeQuizLanding({
  unfinished,
  finished,
  loadingList,
  listError,
  busy,
  error,
  onBegin,
  onContinue,
  onStartNew,
}: {
  unfinished: BespokeSessionViewResponse[];
  finished: BespokeSessionViewResponse[];
  loadingList: boolean;
  listError: string | null;
  busy: boolean;
  error: string | null;
  onBegin: () => void;
  onContinue: (sessionId: string) => void;
  onAbandon: (sessionId: string) => void;
  onStartNew: () => void;
}) {
  const live = unfinished[0] ?? null;
  const lastFinished = !live ? (finished[0] ?? null) : null;

  return (
    <section className="bg-paper py-16 md:py-24">
      <BandInner className="max-w-[640px]">
        <Urdu size="md" tone="brass" align="start">
          {"پہلا سوال"}
        </Urdu>
        <h1 className="mt-3 max-w-[16ch] font-editorial text-h1-editorial text-graphite">
          {live
            ? "You were partway through."
            : lastFinished
              ? "Your formula is ready."
              : "Don't choose a perfume. Find your scent."}
        </h1>
        <p className="mt-5 max-w-[48ch] text-[16px] leading-[1.6] text-graphite-soft">
          {live
            ? `Question ${live.progress.questionsAnswered} of ${live.progress.questionBudget}. Pick up where you left it, or start over.`
            : lastFinished
              ? "A consultation is already composed. Read it, or begin again from the top."
              : "Fifteen questions about mood and memory, none of them about perfume. A few minutes, no sign-up."}
        </p>

        {loadingList ? (
          <p className="mt-8 text-[14px] text-graphite-mute">
            Checking for an open consultation…
          </p>
        ) : null}

        {listError ? (
          <p className="mt-4 text-[14px] text-terra" role="alert">
            {listError}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-[14px] text-terra" role="alert">
            {error}
          </p>
        ) : null}

        {!loadingList ? (
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-start">
            {live ? (
              <>
                <Button
                  type="button"
                  variant="ink"
                  size="pill"
                  className="cursor-pointer"
                  disabled={busy}
                  onClick={() => onContinue(live.sessionId)}
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="outline-paper"
                  size="pill"
                  className="cursor-pointer"
                  disabled={busy}
                  onClick={onStartNew}
                >
                  {busy ? "Starting…" : "Start over"}
                </Button>
              </>
            ) : lastFinished ? (
              <>
                <ButtonLink
                  href={`/bespoke/result/${lastFinished.sessionId}`}
                  variant="ink"
                  size="pill"
                >
                  {lastFinished.name ? `View ${lastFinished.name}` : "View result"}
                </ButtonLink>
                <Button
                  type="button"
                  variant="outline-paper"
                  size="pill"
                  className="cursor-pointer"
                  disabled={busy}
                  onClick={onStartNew}
                >
                  {busy ? "Starting…" : "Start a new one"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ink"
                size="pill"
                className="cursor-pointer"
                disabled={busy}
                onClick={onBegin}
              >
                {busy ? "Starting…" : "Begin"}
              </Button>
            )}
          </div>
        ) : null}
      </BandInner>
    </section>
  );
}

export function BespokeQuizLostSession({
  busy,
  onBack,
  onStartNew,
}: {
  busy: boolean;
  onBack: () => void;
  onStartNew: () => void;
}) {
  return (
    <section className="bg-paper py-16 md:py-24">
      <BandInner className="max-w-[640px]">
        <h2 className="max-w-[18ch] font-editorial text-h2-editorial text-graphite">
          That consultation isn&rsquo;t on this device any more.
        </h2>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.6] text-graphite-soft">
          It may have expired, or the browser cleared its cookies. Nothing you
          answered was lost on our end, but this device can&rsquo;t reach it.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="ink"
            size="pill"
            className="cursor-pointer"
            disabled={busy}
            onClick={onStartNew}
          >
            {busy ? "Starting…" : "Start a consultation"}
          </Button>
          <Button
            type="button"
            variant="outline-paper"
            size="pill"
            className="cursor-pointer"
            disabled={busy}
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </BandInner>
    </section>
  );
}
