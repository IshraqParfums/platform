"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { classifyApiError } from "@/lib/api/api-error";
import { ACCOUNT_HOME, loginPath } from "@/lib/auth/account-routes";
import { ensureShopSession } from "@/lib/auth/shop-session";

export type GuardedLoadState = "loading" | "ready" | "error";

export type GuardedReloadOptions = {
  /**
   * Keep showing the last successful payload while refetching.
   * Use after mutations so the page does not collapse into a skeleton.
   */
  soft?: boolean;
};

export interface GuardedLoad<T> {
  state: GuardedLoadState;
  data: T | null;
  /** Raw rejection from `load`, for screens that classify it. Null until `error`. */
  error: unknown;
  reload: (options?: GuardedReloadOptions) => void;
}

/**
 * The session rule for every authenticated client screen, in one place.
 *
 * A signed-out visitor is sent to the door and left in `loading` — they should
 * never meet an error screen for simply not being signed in. Everyone else gets
 * their data, or the raw failure to interpret.
 *
 * Session recovery is `ensureShopSession`, never the bare cookie probe: the
 * access cookie lasts 15 minutes and the refresh cookie 30 days, so probing
 * alone reports a returning customer as a guest and asks them for a sign-in
 * they do not owe us.
 *
 * `load` must be stable — memoise it with `useCallback`. A new identity means
 * "load something else" and re-runs the gate, which is why it is an honest
 * dependency here rather than a suppressed lint warning.
 */
export function useGuardedLoad<T>(
  load: () => Promise<T>,
  returnTo: string = ACCOUNT_HOME,
): GuardedLoad<T> {
  const router = useRouter();
  const [state, setState] = useState<GuardedLoadState>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const softRef = useRef(false);
  const dataRef = useRef<T | null>(null);

  dataRef.current = data;

  const reload = useCallback((options?: GuardedReloadOptions) => {
    softRef.current = Boolean(options?.soft);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const soft = softRef.current;
      softRef.current = false;
      const keepShowing = soft && dataRef.current !== null;

      if (!keepShowing) {
        setState("loading");
      }
      setError(null);

      const active = await ensureShopSession();
      if (cancelled) return;

      if (!active) {
        router.replace(loginPath(returnTo));
        return;
      }

      try {
        const next = await load();
        if (cancelled) return;
        setData(next);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        // A 401 here is final: `shopFetch` already refreshed and retried, and
        // the refresh route cleared the cookies when it failed. The session is
        // gone, so this is the door — not an error the customer can act on.
        if (classifyApiError(err) === "unauthorized") {
          router.replace(loginPath(returnTo));
          return;
        }
        if (keepShowing) {
          // Soft refresh failed — keep the last good view rather than blanking.
          setState("ready");
          return;
        }
        setError(err);
        setState("error");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [attempt, load, returnTo, router]);

  return { state, data, error, reload };
}
