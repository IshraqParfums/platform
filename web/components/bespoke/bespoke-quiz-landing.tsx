"use client";

import type { BespokeSessionViewResponse } from "@ishraqparfums/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export function BespokeQuizLanding({
  unfinished,
  finished,
  loadingList,
  listError,
  busy,
  error,
  onBegin,
  onContinue,
  onAbandon,
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
  const hasUnfinished = unfinished.length > 0;

  return (
    <Container size="narrow" className="py-8 sm:py-12">
      <Eyebrow>Bespoke consultation</Eyebrow>
      <h1 className="font-display mt-4 text-hero font-semibold text-ink">
        Fifteen questions.
        <br />
        <em className="italic text-ink-soft">None of them about perfume.</em>
      </h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
        Answer honestly. We build a scent fingerprint, match a bottle, and
        include a divergent 2&nbsp;ml sample with every order.
      </p>

      {loadingList ? (
        <p className="mt-8 text-sm text-ink-soft">
          Looking up saved consultations…
        </p>
      ) : null}

      {listError ? (
        <p className="mt-4 text-sm text-rose" role="alert">
          {listError}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-rose" role="alert">
          {error}
        </p>
      ) : null}

      {!loadingList && hasUnfinished ? (
        <ul className="mt-8 flex flex-col gap-4">
          {unfinished.map((view) => (
            <li
              key={view.sessionId}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4 last:border-0"
            >
              <p className="text-[15px] text-ink">
                Question {view.progress.questionsAnswered} of{" "}
                {view.progress.questionBudget}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="emphasis"
                  className="cursor-pointer"
                  disabled={busy}
                  onClick={() => onContinue(view.sessionId)}
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  disabled={busy}
                  onClick={() => onAbandon(view.sessionId)}
                >
                  Abandon
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loadingList && finished.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {finished.map((view) => (
            <li key={view.sessionId}>
              <ButtonLink
                href={`/bespoke/result/${view.sessionId}`}
                variant="outline"
                className="cursor-pointer"
              >
                {view.name ? `View ${view.name}` : "View result"}
              </ButtonLink>
            </li>
          ))}
        </ul>
      ) : null}

      {!loadingList && !hasUnfinished ? (
        <Button
          type="button"
          variant="emphasis"
          size="lg"
          className="mt-8 cursor-pointer"
          disabled={busy}
          onClick={onBegin}
        >
          {busy ? "Starting…" : "Begin"}
        </Button>
      ) : null}

      {!loadingList && hasUnfinished ? (
        <Button
          type="button"
          variant="outline"
          className="mt-6 cursor-pointer"
          disabled={busy}
          onClick={onStartNew}
        >
          {busy ? "Starting…" : "Start a new consultation"}
        </Button>
      ) : null}
    </Container>
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
    <Container size="narrow" className="py-12">
      <h2 className="font-display text-2xl font-semibold text-ink">
        This consultation is no longer available on this device.
      </h2>
      <p className="mt-3 text-[15px] text-ink-soft">
        It may have expired, been abandoned, or the browser cleared its cookies.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          disabled={busy}
          onClick={onBack}
        >
          Back to consultations
        </Button>
        <Button
          type="button"
          variant="emphasis"
          className="cursor-pointer"
          disabled={busy}
          onClick={onStartNew}
        >
          {busy ? "Starting…" : "Start new"}
        </Button>
      </div>
    </Container>
  );
}
