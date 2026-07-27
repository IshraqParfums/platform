"use client";

import { useCallback, useEffect, useState } from "react";
import type { HealthResponse } from "@ishraqparfums/shared";
import { fetchHealth } from "@/lib/api";

function StatusDot({ variant }: { variant: "active" | "offline" | "loading" }) {
  if (variant === "loading") {
    return (
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400 animate-pulse" />
    );
  }

  if (variant === "offline") {
    return (
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
    );
  }

  return (
    <span className="status-dot-active inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
  );
}

export function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setHealth(null);
    setIsOffline(false);

    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsOffline(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Backend Status
        </h2>
        {!isLoading && (
          <button
            type="button"
            onClick={() => void checkHealth()}
            className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Refresh
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-5 dark:bg-zinc-900/60">
          <StatusDot variant="loading" />
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            Pinging...
          </span>
        </div>
      ) : isOffline ? (
        <div className="space-y-4 rounded-xl bg-red-50 px-4 py-5 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <StatusDot variant="offline" />
            <span className="font-medium text-red-800 dark:text-red-300">
              Backend Offline
            </span>
          </div>
          <p className="text-sm text-red-700/80 dark:text-red-300/80">
            Could not reach the API at localhost:3001.
          </p>
        </div>
      ) : health ? (
        <div className="space-y-4 rounded-xl bg-emerald-50 px-4 py-5 dark:bg-emerald-950/25">
          <div className="flex items-center gap-3">
            <StatusDot variant="active" />
            <span className="font-medium text-emerald-900 dark:text-emerald-200">
              Backend Active
            </span>
          </div>
          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-emerald-200/60 pb-3 dark:border-emerald-900/60">
              <dt className="text-emerald-800/70 dark:text-emerald-300/70">
                Service
              </dt>
              <dd className="font-medium text-emerald-950 dark:text-emerald-100">
                {health.service}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-emerald-800/70 dark:text-emerald-300/70">
                Last Checked
              </dt>
              <dd className="font-medium text-emerald-950 dark:text-emerald-100">
                {new Date(health.timestamp).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
