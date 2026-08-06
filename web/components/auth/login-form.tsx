"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/auth/safe-next";
import { emitCartChanged } from "@/lib/cart/cart-events";
import {
  clearGuestCart,
  guestCartItemCount,
  readGuestCart,
} from "@/lib/cart/guest-cart";
import { cn } from "@/lib/cn";

type Step = "phone" | "code";

/**
 * OTP sign-in. After verify, redirects to a safe `?next=` path or `/shop`.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function destination(): string {
    return safeNext(searchParams.get("next")) ?? "/shop";
  }

  function onRequestOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDevHint(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          message?: string | string[];
          expiresInSeconds?: number;
          retryAfterSeconds?: number;
        };

        if (!response.ok) {
          setError(formatApiMessage(data.message) ?? "Could not send code");
          return;
        }

        setStep("code");
        if (process.env.NODE_ENV === "development") {
          setDevHint("Check the API server logs for the OTP code.");
        }
      } catch {
        setError("Could not send code. Try again.");
      }
    });
  }

  function onVerify(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          message?: string | string[];
        };

        if (!response.ok) {
          setError(formatApiMessage(data.message) ?? "Invalid code");
          return;
        }

        await mergeGuestCartAfterLogin();

        router.replace(destination());
        router.refresh();
      } catch {
        setError("Could not verify code. Try again.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
        Sign in
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        We’ll text a one-time code to your phone. No password needed.
      </p>

      {step === "phone" ? (
        <form onSubmit={onRequestOtp} className="mt-8 space-y-5">
          <label className="block">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Mobile number
            </span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              className={fieldClassName()}
            />
          </label>
          <Button
            type="submit"
            size="lg"
            className="w-full cursor-pointer"
            disabled={isPending}
          >
            {isPending ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="mt-8 space-y-5">
          <p className="text-sm text-ink-soft">
            Code sent to{" "}
            <span className="font-medium text-ink">{phone.trim()}</span>
            .{" "}
            <button
              type="button"
              className="cursor-pointer underline underline-offset-2 hover:text-ink"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
                setDevHint(null);
              }}
            >
              Change number
            </button>
          </p>
          <label className="block">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              One-time code
            </span>
            <input
              type="text"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              required
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
              className={fieldClassName()}
            />
          </label>
          <Button
            type="submit"
            size="lg"
            className="w-full cursor-pointer"
            disabled={isPending || code.trim().length < 4}
          >
            {isPending ? "Verifying…" : "Verify & continue"}
          </Button>
        </form>
      )}

      {devHint ? (
        <p className="mt-4 text-sm text-ink-faint">{devHint}</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-deep">{error}</p> : null}
    </div>
  );
}

function fieldClassName(): string {
  return cn(
    "mt-2 w-full rounded-none border border-ink/20 bg-cream-soft px-3.5 py-3",
    "text-[15px] text-ink outline-none transition-colors",
    "placeholder:text-ink-faint focus:border-ink/45",
  );
}

function formatApiMessage(message: string | string[] | undefined): string | null {
  if (!message) return null;
  return Array.isArray(message) ? message.join(" ") : message;
}

/** Soft-merge guest lines into the Nest cart after OTP verify. */
async function mergeGuestCartAfterLogin(): Promise<void> {
  const guest = readGuestCart();
  if (guest.items.length === 0) return;

  try {
    const response = await fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: guest.items.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      cart?: { itemCount?: number };
    };
    clearGuestCart();
    emitCartChanged(
      typeof data.cart?.itemCount === "number"
        ? data.cart.itemCount
        : guestCartItemCount(),
    );
  } catch {
    /* Keep guest cart if merge fails; user can retry next login. */
  }
}

