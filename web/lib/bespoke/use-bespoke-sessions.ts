"use client";

import { useCallback, useEffect, useState } from "react";
import type { BespokeSessionViewResponse } from "@ishraqparfums/shared";

type SessionsState =
  | { status: "loading" }
  | {
      status: "ready";
      unfinished: BespokeSessionViewResponse[];
      finished: BespokeSessionViewResponse[];
    }
  | { status: "error"; message: string };

function isUnfinished(view: BespokeSessionViewResponse): boolean {
  return !view.finished && !view.resultAvailable;
}

function isFinishedUnclaimed(view: BespokeSessionViewResponse): boolean {
  return view.finished || view.resultAvailable;
}

/**
 * Load device consultations from the BFF cookie-backed list.
 */
export function useBespokeSessions(): {
  state: SessionsState;
  refresh: () => void;
} {
  const [state, setState] = useState<SessionsState>({ status: "loading" });
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    void (async () => {
      try {
        const res = await fetch("/api/bespoke/sessions");
        const body = (await res.json().catch(() => ({}))) as {
          sessions?: BespokeSessionViewResponse[];
          message?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setState({
            status: "error",
            message: body.message ?? "Could not load consultations",
          });
          return;
        }
        const sessions = Array.isArray(body.sessions) ? body.sessions : [];
        setState({
          status: "ready",
          unfinished: sessions.filter(isUnfinished),
          finished: sessions.filter(isFinishedUnclaimed),
        });
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Could not load consultations",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { state, refresh };
}
