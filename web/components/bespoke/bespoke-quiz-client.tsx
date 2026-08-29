"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  BespokeAnswerBody,
  BespokePublicNode,
  BespokePublicOption,
  BespokeReferenceProduct,
  BespokeSessionCreateResponse,
  BespokeSessionViewResponse,
} from "@ishraqparfums/shared";
import {
  BespokeQuizLostSession,
} from "@/components/bespoke/bespoke-quiz-landing";
import { BespokeSessionResumeModal } from "@/components/bespoke/bespoke-session-resume-modal";
import {
  ConsultationRecord,
  type RecordEntry,
} from "@/components/bespoke/consultation-record";
import { FollowupTextStep } from "@/components/bespoke/followup-text-step";
import { BandInner } from "@/components/home-v2/ui/band";
import { Button } from "@/components/ui/button";
import { B1_CATCHALL_OPTION_ID, B1_CATEGORIES } from "@/lib/bespoke/b1-categories";
import { useBespokeSessions } from "@/lib/bespoke/use-bespoke-sessions";

type CreateSafe = Omit<BespokeSessionCreateResponse, "sessionToken">;

type QuizPhase =
  | { kind: "gate" }
  | { kind: "loading" }
  | { kind: "lost" }
  | { kind: "quiz" }
  | { kind: "finishing" };

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    session?: BespokeSessionViewResponse;
  };
  if (!res.ok) {
    const err = new Error(
      typeof data.message === "string" ? data.message : "Request failed",
    ) as Error & { status: number; session?: BespokeSessionViewResponse };
    err.status = res.status;
    if (data.session) err.session = data.session;
    throw err;
  }
  return data;
}

function isLostStatus(status: number): boolean {
  return status === 404 || status === 410;
}

function needsComplete(view: BespokeSessionViewResponse): boolean {
  return (
    view.finished ||
    view.resultAvailable ||
    !view.node ||
    view.node.type === "act3_render"
  );
}

/**
 * What to write in the record for an answer, in the visitor's own terms.
 *
 * Derived here from the node and the submitted body rather than passed up
 * from each input component: every node type already carries the labels this
 * needs, and threading a display string back through six different bodies
 * (some of which submit ids, some raw text) would put the same lookup in six
 * places and let them drift.
 *
 * Returns null when there is nothing worth writing down, in which case the
 * answer simply does not appear in the record.
 */
function answerSummary(
  node: BespokePublicNode,
  answer: BespokeAnswerBody,
  shortlist: BespokeSessionViewResponse["shortlist"],
): string | null {
  switch (answer.kind) {
    case "select": {
      const byId = new Map((node.options ?? []).map((o) => [o.id, o.label]));
      const labels = answer.optionIds
        .map((id) => byId.get(id))
        .filter((label): label is string => Boolean(label));
      if (labels.length === 0) return null;
      // Comma, not the middle dot the rest of the page uses for note lists:
      // these are sentences the visitor chose, not a spec strip.
      return labels.join(", ");
    }
    case "free_text":
      return answer.text?.trim() || null;
    case "name":
      return answer.perfumeName?.trim() || null;
    case "candidate":
      return (
        (shortlist ?? []).find((c) => c.id === answer.accordId)?.label ?? null
      );
    case "catalogue_reference":
      return answer.perfumeName ?? null;
    default:
      return null;
  }
}

async function abandonDeviceSession(sessionId: string): Promise<void> {
  await fetch(`/api/bespoke/sessions/${sessionId}/device`, {
    method: "DELETE",
  }).catch(() => undefined);
}

export function BespokeQuizClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("s");
  const { state: listState } = useBespokeSessions();

  const [phase, setPhase] = useState<QuizPhase>(() =>
    urlSessionId ? { kind: "loading" } : { kind: "loading" },
  );
  const bootstrapped = useRef(false);
  const [resume, setResume] = useState<{
    kind: "unfinished" | "finished";
    id: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [node, setNode] = useState<BespokePublicNode | null>(null);
  const [progress, setProgress] = useState({
    questionsAnswered: 0,
    questionBudget: 15,
  });
  const [shortlist, setShortlist] = useState<
    BespokeSessionViewResponse["shortlist"]
  >(null);
  const [echo, setEcho] = useState<string | null>(null);
  const [references, setReferences] = useState<BespokeReferenceProduct[]>([]);
  const [canBack, setCanBack] = useState(false);
  const [finishedPending, setFinishedPending] = useState(false);
  /**
   * The answers written down so far, and the one currently in flight.
   *
   * `pending` is what makes the wait bearable: the tapped option keeps its
   * own state and the rest of the page stays live, instead of `loading`
   * greying out every control until the round trip lands. It is cleared by
   * `applyView`, which is the moment the next question actually arrives.
   */
  const [record, setRecord] = useState<RecordEntry[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [backing, setBacking] = useState(false);

  const applyView = useCallback((view: BespokeSessionViewResponse) => {
    setSessionId(view.sessionId);
    setVersion(view.version);
    setNode(view.node);
    setProgress(view.progress);
    setShortlist(view.shortlist);
    setCanBack(view.progress.questionsAnswered > 0 && !view.finished);
    setFinishedPending(needsComplete(view));
    setPending(null);
    setPhase({ kind: "quiz" });
  }, []);

  const markLost = useCallback(async (id: string) => {
    setPhase({ kind: "lost" });
    setSessionId(null);
    setNode(null);
    await abandonDeviceSession(id);
  }, []);

  /**
   * Last tap goes straight to the result.
   *
   * It used to `await complete` first, which hung a second heavy call off
   * the end of the final answer — the slowest moment in the quiz, on the
   * question where people are most impatient. `loadBespokeSessionResult`
   * already completes on 401/404/409 (lib/bespoke/complete-session.ts), so
   * the result page recovers an uncompleted session on its own and nothing
   * is lost by leaving it to do that.
   */
  const finishAndNavigate = useCallback(
    (id: string) => {
      setPhase({ kind: "finishing" });
      router.push(`/bespoke/result/${id}`);
    },
    [router],
  );

  const createAndEnter = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bespoke/sessions", { method: "POST" });
      const data = await readJson<CreateSafe>(res);
      setSessionId(data.sessionId);
      setVersion(data.version);
      setNode(data.node);
      setProgress(data.progress);
      setShortlist(null);
      setCanBack(false);
      setFinishedPending(false);
      setEcho(null);
      setPhase({ kind: "quiz" });
      router.replace(`/bespoke/quiz?s=${encodeURIComponent(data.sessionId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the quiz");
      setPhase({ kind: "gate" });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load the URL-bound session, or open Q1 / the resume modal when there is none.
  useEffect(() => {
    if (!urlSessionId) {
      if (phase.kind === "quiz" && sessionId) {
        return;
      }
      if (listState.status === "loading") {
        setPhase({ kind: "loading" });
        return;
      }
      if (bootstrapped.current) return;
      bootstrapped.current = true;
      setError(null);
      if (listState.status === "ready") {
        const live = listState.unfinished[0];
        const done = listState.finished[0];
        if (live) {
          setResume({ kind: "unfinished", id: live.sessionId });
          setPhase({ kind: "gate" });
          return;
        }
        if (done) {
          setResume({ kind: "finished", id: done.sessionId });
          setPhase({ kind: "gate" });
          return;
        }
      }
      void createAndEnter();
      return;
    }

    // Already showing this session — skip re-fetch after create replace.
    if (sessionId === urlSessionId && phase.kind === "quiz") {
      return;
    }

    let cancelled = false;
    setPhase({ kind: "loading" });
    setError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/bespoke/sessions/${encodeURIComponent(urlSessionId)}`,
        );
        if (cancelled) return;
        if (isLostStatus(res.status)) {
          await markLost(urlSessionId);
          return;
        }
        const view = await readJson<BespokeSessionViewResponse>(res);
        if (cancelled) return;
        applyView(view);
        if (needsComplete(view)) {
          setPhase({ kind: "finishing" });
          try {
            finishAndNavigate(view.sessionId);
          } catch (e) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : "Could not finish");
              setPhase({ kind: "quiz" });
            }
          }
        }
      } catch (e) {
        if (cancelled) return;
        const status =
          e instanceof Error && "status" in e
            ? (e as Error & { status: number }).status
            : 0;
        if (isLostStatus(status)) {
          await markLost(urlSessionId);
          return;
        }
        setError(e instanceof Error ? e.message : "Could not load consultation");
        setPhase({ kind: "gate" });
        bootstrapped.current = false;
        router.replace("/bespoke/quiz");
      }
    })();

    return () => {
      cancelled = true;
    };
    // sessionId/phase omitted intentionally — only react to URL / device list.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL is the source of truth
  }, [urlSessionId, listState, createAndEnter]);

  /*
   * Reference products, fetched once the consultation itself is open rather
   * than once the `catalogue_select` node is actually on screen.
   *
   * That node sits partway through the graph, so waiting for it meant the
   * question would render with an empty list and "Matching…" filled in a
   * beat later — the one moment in the quiz where the network was visible
   * *inside* a question instead of between two of them. Nothing about the
   * request changed, only when it starts: by the time this node actually
   * comes up the list has had the rest of the quiz to arrive.
   *
   * Runs once per session (keyed on `sessionId`, not on the node), and only
   * once real data exists to fetch, which is `phase === "quiz"`.
   */
  useEffect(() => {
    if (phase.kind !== "quiz" || !sessionId) return;
    let cancelled = false;
    void fetch("/api/bespoke/reference-products")
      .then((r) => r.json())
      .then((list: BespokeReferenceProduct[]) => {
        if (!cancelled) setReferences(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setReferences([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, phase.kind]);

  async function restartSession() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bespoke/sessions/${sessionId}/restart`, {
        method: "POST",
      });
      if (isLostStatus(res.status)) {
        await markLost(sessionId);
        return;
      }
      applyView(await readJson<BespokeSessionViewResponse>(res));
      setFinishedPending(false);
    } catch (e) {
      const status =
        e instanceof Error && "status" in e
          ? (e as Error & { status: number }).status
          : 0;
      if (isLostStatus(status) && sessionId) {
        await markLost(sessionId);
        return;
      }
      setError(e instanceof Error ? e.message : "Could not restart");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(
    answer: BespokeAnswerBody,
    option?: BespokePublicOption,
  ) {
    if (!sessionId || !node) return;
    setLoading(true);
    setError(null);
    if (option?.echo) setEcho(option.echo);
    else setEcho(null);

    /*
     * Write the answer down before asking the server about it.
     *
     * This is the whole perceived-speed fix. The round trip is unchanged —
     * browser to the BFF to Nest and back through two writes — but the tap
     * now lands on something immediately: the answer settles into the record
     * and the chosen option holds its own state, while every other control
     * stays live. What used to happen was `loading` disabling the entire
     * body, so the same wait read as a dead screen with no sign of which
     * option had even been pressed.
     *
     * Rolled back in the `catch` rather than left hopeful: a failed answer
     * that stayed written down would put a line in the record the server has
     * no idea about, and `Back` would then disagree with the server's own
     * history.
     */
    const summary = answerSummary(node, answer, shortlist);
    const entryId = `${node.id}-${version}`;
    const question = node.text ?? node.text_gift ?? "";
    if (summary && question) {
      setPending(summary);
      setRecord((prev) => [
        ...prev,
        { id: entryId, question, answer: summary },
      ]);
    }

    try {
      const res = await fetch(`/api/bespoke/sessions/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, version, answer }),
      });
      if (isLostStatus(res.status)) {
        await markLost(sessionId);
        return;
      }
      if (res.status === 409) {
        const body = (await res.json()) as {
          session?: BespokeSessionViewResponse;
          message?: string;
        };
        if (body.session) {
          applyView(body.session);
          if (needsComplete(body.session)) {
            finishAndNavigate(body.session.sessionId);
          }
          return;
        }
      }
      const view = await readJson<BespokeSessionViewResponse>(res);
      applyView(view);
      if (needsComplete(view)) {
        finishAndNavigate(view.sessionId);
      }
    } catch (e) {
      setPending(null);
      setRecord((prev) => prev.filter((entry) => entry.id !== entryId));
      const status =
        e instanceof Error && "status" in e
          ? (e as Error & { status: number }).status
          : 0;
      if (isLostStatus(status) && sessionId) {
        await markLost(sessionId);
        return;
      }
      setError(e instanceof Error ? e.message : "Could not save answer");
    } finally {
      setLoading(false);
    }
  }

  async function goBack() {
    if (!sessionId || loading || pending !== null || backing) return;
    setBacking(true);
    setLoading(true);
    setEcho(null);
    setPending(null);
    // The server is the authority on the history; this only keeps the
    // written record in step with the question it is about to hand back.
    setRecord((prev) => prev.slice(0, -1));
    try {
      const res = await fetch(`/api/bespoke/sessions/${sessionId}/back`, {
        method: "POST",
      });
      if (isLostStatus(res.status)) {
        await markLost(sessionId);
        return;
      }
      applyView(await readJson<BespokeSessionViewResponse>(res));
      setFinishedPending(false);
    } catch (e) {
      const status =
        e instanceof Error && "status" in e
          ? (e as Error & { status: number }).status
          : 0;
      if (isLostStatus(status) && sessionId) {
        await markLost(sessionId);
        return;
      }
      setError(e instanceof Error ? e.message : "Could not go back");
    } finally {
      setBacking(false);
      setLoading(false);
    }
  }

  if (phase.kind === "lost") {
    return (
      <BespokeQuizLostSession
        busy={loading}
        onBack={() => {
          bootstrapped.current = false;
          setResume(null);
          router.replace("/bespoke/quiz");
        }}
        onStartNew={() => void createAndEnter()}
      />
    );
  }

  if (phase.kind === "gate") {
    return (
      <>
        <QuizOpeningChrome>
          {error ? (
            <p className="text-[14px] text-terra" role="alert">
              {error}
            </p>
          ) : null}
        </QuizOpeningChrome>
        <BespokeSessionResumeModal
          open={resume != null}
          kind={resume?.kind ?? "unfinished"}
          busy={loading}
          onContinue={() => {
            if (!resume) return;
            router.replace(
              `/bespoke/quiz?s=${encodeURIComponent(resume.id)}`,
            );
          }}
          onViewResult={() => {
            if (!resume) return;
            router.push(`/bespoke/result/${resume.id}`);
          }}
          onStartNew={() => {
            void (async () => {
              if (resume) await abandonDeviceSession(resume.id);
              setResume(null);
              bootstrapped.current = true;
              await createAndEnter();
            })();
          }}
        />
      </>
    );
  }

  if (phase.kind === "finishing") {
    return (
      <QuizFrame>
        <p className="font-editorial text-h3-editorial text-graphite-soft">
          Composing your formula…
        </p>
      </QuizFrame>
    );
  }

  if (phase.kind === "loading") {
    return <QuizOpeningChrome />;
  }

  if (!node && !finishedPending) {
    return (
      <QuizFrame>
        <h2 className="max-w-[18ch] font-editorial text-h2-editorial text-graphite">
          This consultation is out of date.
        </h2>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.6] text-graphite-soft">
          The questions moved on while this one was open. Starting again takes
          it from the top.
        </p>
        {error ? (
          <p className="mt-4 text-[14px] text-terra" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="ink"
          size="pill"
          className="mt-8"
          disabled={loading}
          onClick={() => void restartSession()}
        >
          {loading ? "Starting…" : "Start again"}
        </Button>
      </QuizFrame>
    );
  }

  if (!node && finishedPending) {
    return (
      <QuizFrame>
        <p className="font-editorial text-h3-editorial text-graphite-soft">
          Composing your formula…
        </p>
      </QuizFrame>
    );
  }

  if (!node) return null;

  const pct = Math.min(
    100,
    Math.round(
      (progress.questionsAnswered / Math.max(1, progress.questionBudget)) * 100,
    ),
  );

  return (
    <>
    <QuizFrame>
      {/*
        The head of the page is the state of the consultation: how far in you
        are, and the way back. Both sit on one line above a hairline that
        fills — a rule rather than a bar, because a filled track with a
        rounded cap is dashboard furniture and this page is a page.
      */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-ui text-[11px] uppercase tracking-[0.18em] text-graphite-mute">
          Question {Math.min(progress.questionsAnswered + 1, progress.questionBudget)}{" "}
          of {progress.questionBudget}
        </p>
        {canBack ? (
          <button
            type="button"
            className="cursor-pointer font-ui text-[11px] uppercase tracking-[0.16em] text-graphite-mute transition-colors hover:text-terra disabled:cursor-not-allowed disabled:opacity-40"
            disabled={loading || pending !== null || backing}
            aria-busy={backing}
            onClick={() => void goBack()}
          >
            {backing ? "Going back…" : "Back"}
          </button>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="mt-3 h-px w-full bg-graphite/12"
      >
        <div
          className="h-full bg-terra transition-[width] duration-500 ease-[cubic-bezier(0.22,0.8,0.28,1)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/*
        `key` on the question is what makes each one arrive rather than
        swap: remounting restarts the entrance, so the new question rises
        into the space the answer just vacated instead of the old text being
        replaced in place.
      */}
      <div key={`${node.id}-${version}`} className="question-arrive mt-10">
        <h2 className="max-w-[24ch] font-editorial text-[clamp(26px,3.4vw,40px)] leading-[1.14] text-graphite">
          {node.text}
        </h2>

        {node.disclosure_copy ? (
          <p className="mt-4 max-w-[52ch] text-[14.5px] leading-[1.6] text-graphite-soft">
            {node.disclosure_copy}
          </p>
        ) : null}

        {echo ? (
          <p className="mt-5 border-l border-brass/50 pl-4 font-editorial text-[18px] italic leading-[1.4] text-graphite-soft">
            {echo}
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 text-[14px] text-terra" role="alert">
            {error}
          </p>
        ) : null}

        {/*
          `disabled` is deliberately NOT wired to `loading` any more. The
          answer is already written down and the chosen option is already
          holding its own state, so freezing the rest of the body adds
          nothing except the feeling that the page has stopped. It still
          locks while an answer is genuinely in flight for THIS node, which
          is what stops a double tap submitting twice.
        */}
        <div className="mt-9">
          <NodeBody
            node={node}
            shortlist={shortlist}
            references={references}
            disabled={pending !== null || backing}
            onAnswer={(answer, option) => void submitAnswer(answer, option)}
          />
        </div>
      </div>
    </QuizFrame>
      {record.length > 0 ? (
        <section className="bg-paper-deep py-10 md:py-14">
          <BandInner className="max-w-[720px]">
            <p className="font-ui text-[11px] uppercase tracking-[0.16em] text-graphite-mute">
              Your answers
            </p>
            <div className="mt-5">
              <ConsultationRecord entries={record} />
            </div>
          </BandInner>
        </section>
      ) : null}
    </>
  );
}

/**
 * One measure for every state the quiz can be in.
 *
 * Narrower than the band the rest of the site uses. A consultation is read
 * one question at a time and the answers under it are short; at the full
 * 1320 the options stretched into strips you had to track across, and the
 * question itself ran past a comfortable line length.
 */
function QuizFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[70vh] bg-paper py-14 md:py-20">
      <BandInner className="max-w-[720px]">{children}</BandInner>
    </section>
  );
}

/** Quiz chrome while the session is still being opened — not a status sentence. */
function QuizOpeningChrome({ children }: { children?: React.ReactNode }) {
  return (
    <QuizFrame>
      <p className="font-ui text-[11px] uppercase tracking-[0.18em] text-graphite-mute">
        Question 1 of 15
      </p>
      <div aria-hidden="true" className="mt-3 h-px w-full bg-graphite/12" />
      <div className="mt-10">
        <div
          className="h-10 w-[min(24ch,100%)] animate-pulse rounded-sm bg-graphite/10"
          aria-hidden
        />
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </QuizFrame>
  );
}

function NodeBody({
  node,
  shortlist,
  references,
  disabled,
  onAnswer,
}: {
  node: BespokePublicNode;
  shortlist: BespokeSessionViewResponse["shortlist"];
  references: BespokeReferenceProduct[];
  disabled: boolean;
  onAnswer: (answer: BespokeAnswerBody, option?: BespokePublicOption) => void;
}) {
  switch (node.type) {
    case "single_select":
      // B1 is the one question with 91 options in a flat list — everything
      // else in the graph has few enough that a flat list is the right
      // answer. See lib/bespoke/b1-categories.ts for why the split is by
      // theme and how it stays safe if the question's own options change.
      if (node.id === "B1") {
        return (
          <CategorizedSingleSelect
            options={node.options ?? []}
            disabled={disabled}
            onAnswer={onAnswer}
          />
        );
      }
      return (
        <SingleSelectWithFollowup
          options={node.options ?? []}
          disabled={disabled}
          onAnswer={onAnswer}
        />
      );
    case "multi_select":
      return (
        <MultiSelect
          options={node.options ?? []}
          disabled={disabled}
          onSubmit={(ids, followupText) =>
            onAnswer({
              kind: "select",
              optionIds: ids,
              ...(followupText ? { followupText } : {}),
            })
          }
        />
      );
    case "free_text":
      return (
        <FreeText
          disabled={disabled}
          optional={node.optional}
          onSubmit={(text) => onAnswer({ kind: "free_text", text })}
        />
      );
    case "name_entry":
      return (
        <NameEntry
          node={node}
          disabled={disabled}
          onSubmit={(perfumeName, dedication, nameSource) =>
            onAnswer({ kind: "name", perfumeName, dedication, nameSource })
          }
        />
      );
    case "candidate_select":
      return (
        <ul className="flex flex-col gap-3">
          {(shortlist ?? []).map((card) => (
            <li key={card.id}>
              <button
                type="button"
                disabled={disabled}
                className="group relative w-full cursor-pointer overflow-hidden rounded-[3px] border border-graphite/[0.14] bg-shell px-4 py-4 text-left transition-colors duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] hover:border-terra/35 hover:bg-terra/[0.045] disabled:cursor-default disabled:opacity-45"
                onClick={() =>
                  onAnswer({ kind: "candidate", accordId: card.id })
                }
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-[2px] origin-bottom scale-y-0 bg-terra transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-y-100"
                />
                <span className="font-editorial text-[20px] leading-none text-graphite">
                  {card.label}
                </span>
                <span className="mt-2.5 block text-[13px] leading-[1.5] text-graphite-soft">
                  {[
                    ...card.notesByPosition.top,
                    ...card.notesByPosition.heart,
                    ...card.notesByPosition.base,
                  ]
                    .slice(0, 5)
                    .join(" · ")}
                </span>
              </button>
            </li>
          ))}
          {!shortlist?.length ? (
            <p className="text-[14px] text-graphite-soft">
              Matching candidates…
            </p>
          ) : null}
        </ul>
      );
    case "catalogue_select":
      return (
        <CatalogueSelect
          references={references}
          skipLabel={node.skip_label}
          disabled={disabled}
          onPick={(perfume) =>
            onAnswer({
              kind: "catalogue_reference",
              perfumeId: perfume?.id ?? null,
              perfumeName: perfume?.name ?? null,
            })
          }
        />
      );
    case "act3_render":
      return <p className="text-ink-soft">Finishing…</p>;
    default:
      return null;
  }
}

/**
 * B1's 91 options, two taps deep instead of one flat scroll: pick a
 * category, then pick the specific memory within it. Selecting a leaf
 * option submits exactly what the flat list would have — `{ optionIds:
 * [option.id] }` — so every option's own `next` (91 distinct B2-* targets
 * in questions.json, one per option) fires exactly as before. Nothing
 * about the graph changes; this only changes how many rows are on screen
 * at once while getting there.
 */
function CategorizedSingleSelect({
  options,
  disabled,
  onAnswer,
}: {
  options: BespokePublicOption[];
  disabled: boolean;
  onAnswer: (answer: BespokeAnswerBody, option?: BespokePublicOption) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const byId = new Map(options.map((o) => [o.id, o]));
  const catchall = byId.get(B1_CATCHALL_OPTION_ID);

  // Anything in the live option list that isn't in any named category (or
  // the catch-all) still needs a home — falls into a trailing "More"
  // category rather than silently vanishing if questions.json changes
  // without this file's grouping being updated to match.
  const categorized = new Set(B1_CATEGORIES.flatMap((c) => c.optionIds));
  const leftover = options
    .map((o) => o.id)
    .filter((id) => id !== B1_CATCHALL_OPTION_ID && !categorized.has(id));
  const categories = leftover.length
    ? [...B1_CATEGORIES, { id: "more", label: "More", optionIds: leftover }]
    : B1_CATEGORIES;

  function pick(option: BespokePublicOption) {
    setClickedId(option.id);
    onAnswer({ kind: "select", optionIds: [option.id] }, option);
  }

  if (activeCategory) {
    const category = categories.find((c) => c.id === activeCategory);
    const items = (category?.optionIds ?? [])
      .map((id) => byId.get(id))
      .filter((o): o is BespokePublicOption => Boolean(o));
    return (
      <div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setActiveCategory(null)}
          className="mb-4 cursor-pointer font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute transition-colors hover:text-terra disabled:cursor-default disabled:opacity-45"
        >
          ‹ All categories
        </button>
        <ul className="flex flex-col gap-2.5">
          {items.map((option, i) => (
            <li key={option.id}>
              <OptionButton
                disabled={disabled}
                chosen={disabled && clickedId === option.id}
                label={option.label}
                index={i}
                onClick={() => pick(option)}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setActiveCategory(category.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[3px] border border-graphite/[0.14] bg-shell px-4 py-3.5 text-left transition-colors duration-300 hover:border-terra/35 hover:bg-terra/[0.045] disabled:cursor-default disabled:opacity-45"
            >
              <span className="text-[15px] text-graphite">{category.label}</span>
              <span className="font-ui text-[11px] text-graphite-faint">{category.optionIds.length}</span>
            </button>
          </li>
        ))}
      </ul>
      {catchall ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => pick(catchall)}
          className={
            "mt-4 w-full cursor-pointer rounded-[3px] border border-dashed px-4 py-3.5 text-left text-[15px] transition-colors duration-300 disabled:cursor-default " +
            (disabled && clickedId === catchall.id
              ? "border-terra/50 bg-terra/[0.05] text-graphite"
              : "border-graphite/25 text-graphite-soft hover:border-terra/45 hover:text-graphite disabled:opacity-45")
          }
        >
          {catchall.label}
        </button>
      ) : null}
    </div>
  );
}

function SingleSelectWithFollowup({
  options,
  disabled,
  onAnswer,
}: {
  options: BespokePublicOption[];
  disabled: boolean;
  onAnswer: (answer: BespokeAnswerBody, option?: BespokePublicOption) => void;
}) {
  const [pending, setPending] = useState<BespokePublicOption | null>(null);
  // Which option was actually tapped, kept apart from `pending` above (that
  // one only tracks the follow-up-text detour). This is what lets a single
  // option hold the chosen state while `disabled` is true for everyone else.
  const [clickedId, setClickedId] = useState<string | null>(null);

  if (pending?.followup_free_text) {
    return (
      <FollowupTextStep
        prompt={pending.followup_free_text}
        required={pending.followup_required !== false}
        disabled={disabled}
        onCancel={() => setPending(null)}
        onSubmit={(followupText) => {
          setClickedId(pending.id);
          onAnswer(
            { kind: "select", optionIds: [pending.id], followupText },
            pending,
          );
          setPending(null);
        }}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {options.map((option, i) => (
        <li key={option.id}>
          <OptionButton
            disabled={disabled}
            chosen={disabled && clickedId === option.id}
            label={option.label}
            highlight={option.highlight}
            index={i}
            onClick={() => {
              if (option.followup_free_text) {
                setPending(option);
                return;
              }
              setClickedId(option.id);
              onAnswer({ kind: "select", optionIds: [option.id] }, option);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * One answer.
 *
 * `chosen` is what a tap looks like while the request is in flight: the
 * option holds a terra rule and its number turns terra, rather than the
 * option going grey along with every other control on the page. Everything
 * else stays interactive underneath it (the header, the Back link) because
 * only this one question's answer is actually pending.
 */
function OptionButton({
  label,
  highlight,
  disabled,
  chosen = false,
  index,
  onClick,
}: {
  label: string;
  highlight?: string;
  disabled: boolean;
  chosen?: boolean;
  index?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "group relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-[3px] border px-4 py-3.5 text-left " +
        "transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] disabled:cursor-default " +
        (chosen
          ? "border-terra/45 bg-terra/[0.06]"
          : "border-graphite/[0.14] bg-shell hover:border-terra/35 hover:bg-terra/[0.045] disabled:opacity-45")
      }
    >
      <span
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-y-0 left-0 w-[2px] origin-bottom bg-terra transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] " +
          (chosen ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100")
        }
      />
      {typeof index === "number" ? (
        <span
          className={
            "font-ui text-[11px] font-semibold transition-colors duration-300 " +
            (chosen ? "text-terra" : "text-graphite-faint group-hover:text-terra")
          }
        >
          {index + 1}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-[15px] leading-[1.4] text-graphite">
        {label}
      </span>
      {highlight ? (
        <span className="shrink-0 font-ui text-[11px] uppercase tracking-[0.1em] text-graphite-faint">
          {highlight}
        </span>
      ) : null}
    </button>
  );
}

function MultiSelect({
  options,
  disabled,
  onSubmit,
}: {
  options: BespokePublicOption[];
  disabled: boolean;
  onSubmit: (ids: string[], followupText?: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [awaitingFollowup, setAwaitingFollowup] = useState(false);

  function toggle(option: BespokePublicOption) {
    if (option.exclusive) {
      setSelected([option.id]);
      return;
    }
    setSelected((prev) => {
      const withoutExclusive = prev.filter(
        (id) => !options.find((o) => o.id === id)?.exclusive,
      );
      return withoutExclusive.includes(option.id)
        ? withoutExclusive.filter((id) => id !== option.id)
        : [...withoutExclusive, option.id];
    });
  }

  const followupOption = options.find(
    (o) => selected.includes(o.id) && o.followup_free_text,
  );
  const followupPrompt = followupOption?.followup_free_text;

  // Every question in this quiz answers itself on a single tap except this
  // one, which needs an explicit "I'm done picking" gesture since more than
  // one option can be true at once. The Continue button used to also stay
  // disabled until something was picked — on a question that already has a
  // dedicated "none of these" option, that just meant a dead-looking button
  // sitting under an unanswered question. This option (there is exactly one,
  // exclusive="true" is defined once per multi_select node) already carries
  // an empty constraint, so it's a safe stand-in for "nothing selected."
  const noneOption = options.find((o) => o.exclusive);

  if (awaitingFollowup && followupPrompt) {
    return (
      <FollowupTextStep
        prompt={followupPrompt}
        required={followupOption?.followup_required !== false}
        disabled={disabled}
        onCancel={() => setAwaitingFollowup(false)}
        onSubmit={(followupText) => {
          onSubmit(selected, followupText);
          setAwaitingFollowup(false);
        }}
      />
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-2.5">
        {options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(option)}
                className={
                  "relative w-full cursor-pointer overflow-hidden rounded-[3px] border px-4 py-3.5 text-left text-[15px] leading-[1.4] " +
                  "transition-colors duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] disabled:cursor-default disabled:opacity-45 " +
                  (on
                    ? "border-terra/45 bg-terra/[0.08] text-graphite"
                    : "border-graphite/[0.14] bg-shell text-graphite hover:border-terra/35 hover:bg-terra/[0.045]")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "pointer-events-none absolute inset-y-0 left-0 w-[2px] origin-bottom bg-terra transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] " +
                    (on ? "scale-y-100" : "scale-y-0")
                  }
                />
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="ink"
        size="pill"
        className="mt-6 cursor-pointer"
        disabled={disabled || (selected.length === 0 && !noneOption)}
        onClick={() => {
          if (followupPrompt) {
            setAwaitingFollowup(true);
            return;
          }
          // Nothing picked and there's a "none of these" option on this
          // question — submit that instead of blocking on a selection the
          // user was never going to make. Same outcome as tapping it
          // explicitly, one tap instead of two.
          const toSubmit =
            selected.length > 0 ? selected : noneOption ? [noneOption.id] : selected;
          onSubmit(toSubmit);
        }}
      >
        Continue
      </Button>
    </div>
  );
}

function FreeText({
  disabled,
  optional,
  onSubmit,
}: {
  disabled: boolean;
  optional?: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={disabled}
        className="w-full rounded-[3px] border border-graphite/[0.16] bg-shell px-4 py-3 text-[15px] leading-[1.5] text-graphite outline-none transition-colors duration-300 focus:border-terra/45 disabled:opacity-45"
      />
      <div className="mt-5 flex gap-3">
        <Button
          type="button"
          variant="ink"
          size="pill"
          className="cursor-pointer"
          disabled={disabled || (!optional && !text.trim())}
          onClick={() => onSubmit(text.trim())}
        >
          Continue
        </Button>
        {optional ? (
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer text-graphite-soft hover:text-graphite"
            disabled={disabled}
            onClick={() => onSubmit("")}
          >
            Skip
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function NameEntry({
  node,
  disabled,
  onSubmit,
}: {
  node: BespokePublicNode;
  disabled: boolean;
  onSubmit: (
    name: string,
    dedication: string | undefined,
    source: "customer_typed" | "chose_offered",
  ) => void;
}) {
  const fields = node.fields;
  const [name, setName] = useState("");
  const [dedication, setDedication] = useState("");
  const maxName = fields?.perfume_name.max ?? 28;
  const maxDed = fields?.dedication.max ?? 60;

  return (
    <div className="flex flex-col gap-4">
      {(node.generatedNames ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {node.generatedNames!.map((offer) => (
            <button
              key={offer}
              type="button"
              disabled={disabled}
              className="cursor-pointer rounded-full border border-graphite/20 px-3.5 py-1.5 font-editorial text-[15px] text-graphite transition-colors duration-300 hover:border-terra/45 hover:text-terra disabled:cursor-default disabled:opacity-45"
              onClick={() =>
                onSubmit(offer, dedication || undefined, "chose_offered")
              }
            >
              {offer}
            </button>
          ))}
        </div>
      ) : null}
      <label className="block">
        <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
          Name
        </span>
        <input
          value={name}
          maxLength={maxName}
          disabled={disabled}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-[3px] border border-graphite/[0.16] bg-shell px-4 py-3 text-[15px] text-graphite outline-none transition-colors duration-300 focus:border-terra/45 disabled:opacity-45"
        />
      </label>
      <label className="block">
        <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
          Dedication (optional)
        </span>
        <input
          value={dedication}
          maxLength={maxDed}
          disabled={disabled}
          placeholder={fields?.dedication.placeholder}
          onChange={(e) => setDedication(e.target.value)}
          className="mt-2 w-full rounded-[3px] border border-graphite/[0.16] bg-shell px-4 py-3 text-[15px] text-graphite outline-none transition-colors duration-300 placeholder:text-graphite-faint focus:border-terra/45 disabled:opacity-45"
        />
      </label>
      <Button
        type="button"
        variant="ink"
        size="pill"
        className="cursor-pointer self-start"
        disabled={
          disabled || name.trim().length < (fields?.perfume_name.min ?? 1)
        }
        onClick={() =>
          onSubmit(name.trim(), dedication.trim() || undefined, "customer_typed")
        }
      >
        Name it
      </Button>
    </div>
  );
}

function CatalogueSelect({
  references,
  skipLabel,
  disabled,
  onPick,
}: {
  references: BespokeReferenceProduct[];
  skipLabel?: string;
  disabled: boolean;
  onPick: (perfume: BespokeReferenceProduct | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {references.map((perfume) => (
        <button
          key={perfume.id}
          type="button"
          disabled={disabled}
          className="relative cursor-pointer overflow-hidden rounded-[3px] border border-graphite/[0.14] bg-shell px-4 py-3.5 text-left font-editorial text-[17px] text-graphite transition-colors duration-300 ease-[cubic-bezier(0.22,0.8,0.28,1)] hover:border-terra/35 hover:bg-terra/[0.045] disabled:cursor-default disabled:opacity-45"
          onClick={() => onPick(perfume)}
        >
          {perfume.name}
        </button>
      ))}
      {!references.length ? (
        <p className="text-[14px] text-graphite-soft">
          No reference products are profiled yet, you can skip this one.
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="mt-2 cursor-pointer self-start text-graphite-soft hover:text-graphite"
        disabled={disabled}
        onClick={() => onPick(null)}
      >
        {skipLabel ?? "Skip"}
      </Button>
    </div>
  );
}
