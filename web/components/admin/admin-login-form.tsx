"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { ADMIN_HOME, safeAdminNext } from "@/lib/auth/admin-routes";
import { ensureAdminSession } from "@/lib/auth/admin-session";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const next = searchParams.get("next");
  const destination = safeAdminNext(next) || ADMIN_HOME;

  /**
   * The page already turned away anyone holding a live access cookie via
   * middleware. What is left is an admin whose access token lapsed but whose
   * refresh is good: rotate it and let them through rather than asking for a
   * password they do not owe us.
   */
  useEffect(() => {
    let cancelled = false;

    void ensureAdminSession().then((active) => {
      if (cancelled) return;
      if (active) {
        setSignedIn(true);
        router.replace(destination);
        return;
      }
      setSessionChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [destination, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Invalid email or password");
      }

      toast.success("Signed in");
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (signedIn || !sessionChecked) {
    return (
      <p className="font-mono text-label-sm uppercase text-ink-faint">
        {signedIn
          ? "Already signed in — taking you through…"
          : "Checking your session…"}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-email"
          className="font-mono text-label-sm uppercase tracking-wide text-ink-faint"
        >
          Email
        </label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-password"
          className="font-mono text-label-sm uppercase tracking-wide text-ink-faint"
        >
          Password
        </label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-rose-deep">{error}</p> : null}

      <Button
        type="submit"
        variant="emphasis"
        size="md"
        disabled={submitting}
        className="mt-2 cursor-pointer"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
