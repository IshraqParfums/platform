"use client";

import { useCallback, useEffect, useState } from "react";
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
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  type BespokeDimension,
} from "@ishraqparfums/shared";
import {
  BespokeQuizLanding,
  BespokeQuizLostSession,
} from "@/components/bespoke/bespoke-quiz-landing";
import { FollowupTextStep } from "@/components/bespoke/followup-text-step";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { completeBespokeSession } from "@/lib/bespoke/complete-session";
import { useBespokeSessions } from "@/lib/bespoke/use-bespoke-sessions";

type CreateSafe = Omit<BespokeSessionCreateResponse, "sessionToken">;

type QuizPhase =
  | { kind: "landing" }
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

async function abandonDeviceSession(sessionId: string): Promise<void> {
  await fetch(`/api/bespoke/sessions/${sessionId}/device`, {
    method: "DELETE",
  }).catch(() => undefined);
}

export function BespokeQuizClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("s");
  const { state: listState, refresh: refreshList } = useBespokeSessions();

  const [phase, setPhase] = useState<QuizPhase>(() =>
    urlSessionId ? { kind: "loading" } : { kind: "landing" },
  );
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

  const applyView = useCallback((view: BespokeSessionViewResponse) => {
    setSessionId(view.sessionId);
    setVersion(view.version);
    setNode(view.node);
    setProgress(view.progress);
    setShortlist(view.shortlist);
    setCanBack(view.progress.questionsAnswered > 0 && !view.finished);
    setFinishedPending(needsComplete(view));
    setPhase({ kind: "quiz" });
  }, []);

  const markLost = useCallback(async (id: string) => {
    setPhase({ kind: "lost" });
    setSessionId(null);
    setNode(null);
    await abandonDeviceSession(id);
  }, []);

  const finishAndNavigate = useCallback(
    async (id: string) => {
      setPhase({ kind: "finishing" });
      await completeBespokeSession(id);
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
      setPhase({ kind: "landing" });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load the URL-bound session (or return to landing when `s` is cleared).
  useEffect(() => {
    if (!urlSessionId) {
      setPhase({ kind: "landing" });
      setSessionId(null);
      setNode(null);
      setFinishedPending(false);
      setError(null);
      refreshList();
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
            await finishAndNavigate(view.sessionId);
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
        setPhase({ kind: "landing" });
        router.replace("/bespoke/quiz");
      }
    })();

    return () => {
      cancelled = true;
    };
    // sessionId/phase omitted intentionally — only react to URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL is the source of truth
  }, [urlSessionId]);

  useEffect(() => {
    if (node?.type !== "catalogue_select") return;
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
  }, [node?.id, node?.type]);

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
            await finishAndNavigate(body.session.sessionId);
          }
          return;
        }
      }
      const view = await readJson<BespokeSessionViewResponse>(res);
      applyView(view);
      if (needsComplete(view)) {
        await finishAndNavigate(view.sessionId);
      }
    } catch (e) {
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
    if (!sessionId) return;
    setLoading(true);
    setEcho(null);
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
      setLoading(false);
    }
  }

  async function handleAbandon(id: string) {
    setLoading(true);
    setError(null);
    try {
      await abandonDeviceSession(id);
      refreshList();
    } finally {
      setLoading(false);
    }
  }

  if (phase.kind === "lost") {
    return (
      <BespokeQuizLostSession
        busy={loading}
        onBack={() => {
          setPhase({ kind: "landing" });
          router.replace("/bespoke/quiz");
        }}
        onStartNew={() => void createAndEnter()}
      />
    );
  }

  if (phase.kind === "landing" || !urlSessionId) {
    const unfinished =
      listState.status === "ready" ? listState.unfinished : [];
    const finished = listState.status === "ready" ? listState.finished : [];
    return (
      <BespokeQuizLanding
        unfinished={unfinished}
        finished={finished}
        loadingList={listState.status === "loading"}
        listError={listState.status === "error" ? listState.message : null}
        busy={loading}
        error={error}
        onBegin={() => void createAndEnter()}
        onContinue={(id) => {
          router.push(`/bespoke/quiz?s=${encodeURIComponent(id)}`);
        }}
        onAbandon={(id) => void handleAbandon(id)}
        onStartNew={() => void createAndEnter()}
      />
    );
  }

  if (phase.kind === "loading" || phase.kind === "finishing") {
    return (
      <Container size="narrow" className="py-12">
        <p className="text-ink-soft">
          {phase.kind === "finishing"
            ? "Preparing your result…"
            : "Loading consultation…"}
        </p>
      </Container>
    );
  }

  if (!node && !finishedPending) {
    return (
      <Container size="narrow" className="py-12">
        <h2 className="font-display text-2xl font-semibold text-ink">
          This consultation is outdated
        </h2>
        <p className="mt-3 text-[15px] text-ink-soft">
          The question graph moved on. Restart to continue from the beginning of
          this session.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-rose" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="emphasis"
          className="mt-6 cursor-pointer"
          disabled={loading}
          onClick={() => void restartSession()}
        >
          {loading ? "Restarting…" : "Restart consultation"}
        </Button>
      </Container>
    );
  }

  if (!node && finishedPending) {
    return (
      <Container size="narrow" className="py-12">
        <p className="text-ink-soft">Preparing your result…</p>
      </Container>
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
    <Container size="narrow" className="py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-label uppercase text-ink-faint">
          {progress.questionsAnswered} / {progress.questionBudget}
        </span>
        {canBack ? (
          <button
            type="button"
            className="cursor-pointer font-mono text-label uppercase text-ink-soft transition-colors hover:text-ink"
            disabled={loading}
            onClick={() => void goBack()}
          >
            Back
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-rose transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <EssenceOrb answerCount={progress.questionsAnswered} />

      <h2 className="font-display mt-8 text-[clamp(22px,3vw,32px)] font-semibold leading-snug text-ink">
        {node.text}
      </h2>
      {node.disclosure_copy ? (
        <p className="mt-3 text-sm text-ink-soft">{node.disclosure_copy}</p>
      ) : null}
      {echo ? (
        <p className="mt-4 border-l-2 border-gold/60 pl-3 text-sm italic text-ink-soft">
          {echo}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-rose" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <NodeBody
          node={node}
          shortlist={shortlist}
          references={references}
          disabled={loading}
          onAnswer={(answer, option) => void submitAnswer(answer, option)}
        />
      </div>
    </Container>
  );
}

function EssenceOrb({ answerCount }: { answerCount: number }) {
  const dims = Object.keys(BESPOKE_FAMILY_COLOR) as BespokeDimension[];
  const dim = dims[Math.min(answerCount, dims.length - 1)] ?? "woody";
  const color = BESPOKE_FAMILY_COLOR[dim];
  return (
    <div className="mt-8 flex justify-center" aria-hidden>
      <div
        className="h-24 w-16 rounded-[40%] border border-ink/10 shadow-inner transition-colors duration-500"
        style={{
          background: `linear-gradient(180deg, ${color}55 0%, ${color} 70%)`,
        }}
        title={BESPOKE_DIMENSION_LABEL[dim]}
      />
    </div>
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
                className="w-full cursor-pointer rounded-xl border border-ink/12 bg-card px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-cream-soft disabled:opacity-50"
                onClick={() =>
                  onAnswer({ kind: "candidate", accordId: card.id })
                }
              >
                <span className="font-display text-lg font-semibold text-ink">
                  {card.label}
                </span>
                <span className="mt-2 block text-sm text-ink-soft">
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
            <p className="text-sm text-ink-soft">Matching candidates…</p>
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

  if (pending?.followup_free_text) {
    return (
      <FollowupTextStep
        prompt={pending.followup_free_text}
        disabled={disabled}
        onCancel={() => setPending(null)}
        onSubmit={(followupText) => {
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
            label={option.label}
            highlight={option.highlight}
            index={i}
            onClick={() => {
              if (option.followup_free_text) {
                setPending(option);
                return;
              }
              onAnswer({ kind: "select", optionIds: [option.id] }, option);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function OptionButton({
  label,
  highlight,
  disabled,
  index,
  onClick,
}: {
  label: string;
  highlight?: string;
  disabled: boolean;
  index?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full cursor-pointer items-start gap-3 rounded-xl border border-ink/12 bg-card px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-cream-soft disabled:opacity-50"
    >
      {typeof index === "number" ? (
        <span className="font-mono text-label-sm text-ink-faint transition-colors group-hover:text-gold-deeper">
          {index + 1}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">
        {label}
      </span>
      {highlight ? (
        <span className="shrink-0 font-mono text-label-sm uppercase text-ink-faint">
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

  const followupPrompt = options.find(
    (o) => selected.includes(o.id) && o.followup_free_text,
  )?.followup_free_text;

  if (awaitingFollowup && followupPrompt) {
    return (
      <FollowupTextStep
        prompt={followupPrompt}
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
                className={`w-full cursor-pointer rounded-xl border px-4 py-3.5 text-left text-[15px] font-semibold transition-all duration-200 disabled:opacity-50 ${
                  on
                    ? "border-gold bg-gold text-deep"
                    : "border-ink/12 bg-card text-ink hover:-translate-y-0.5 hover:border-gold/50"
                }`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="emphasis"
        className="mt-5 cursor-pointer"
        disabled={disabled || selected.length === 0}
        onClick={() => {
          if (followupPrompt) {
            setAwaitingFollowup(true);
            return;
          }
          onSubmit(selected);
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
        className="w-full rounded-xl border border-ink/12 bg-card px-4 py-3 text-[15px] text-ink outline-none focus:border-gold/50"
      />
      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          variant="emphasis"
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
            className="cursor-pointer"
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
              className="cursor-pointer rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink hover:border-ink/40 disabled:opacity-50"
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
        <span className="font-mono text-label-sm uppercase text-ink-faint">
          Name
        </span>
        <input
          value={name}
          maxLength={maxName}
          disabled={disabled}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-ink/12 bg-card px-4 py-3 text-[15px] outline-none focus:border-gold/50"
        />
      </label>
      <label className="block">
        <span className="font-mono text-label-sm uppercase text-ink-faint">
          Dedication (optional)
        </span>
        <input
          value={dedication}
          maxLength={maxDed}
          disabled={disabled}
          placeholder={fields?.dedication.placeholder}
          onChange={(e) => setDedication(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-ink/12 bg-card px-4 py-3 text-[15px] outline-none focus:border-gold/50"
        />
      </label>
      <Button
        type="button"
        variant="emphasis"
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
          className="cursor-pointer rounded-xl border border-ink/12 bg-card px-4 py-3.5 text-left font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-cream-soft disabled:opacity-50"
          onClick={() => onPick(perfume)}
        >
          {perfume.name}
        </button>
      ))}
      {!references.length ? (
        <p className="text-sm text-ink-soft">
          No reference products are profiled yet — you can skip.
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="mt-2 cursor-pointer self-start"
        disabled={disabled}
        onClick={() => onPick(null)}
      >
        {skipLabel ?? "Skip"}
      </Button>
    </div>
  );
}
