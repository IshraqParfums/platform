"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import { LoginAtmosphere } from "@/components/auth/login-atmosphere";
import { OtpInput, type OtpInputHandle } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { PhoneField } from "@/components/ui/phone-field";
import { ACCOUNT_HOME } from "@/lib/auth/account-routes";
import { safeNext } from "@/lib/auth/safe-next";
import { shopFetch } from "@/lib/auth/shop-fetch";
import { ensureShopSession } from "@/lib/auth/shop-session";
import { emitCartChanged } from "@/lib/cart/cart-events";
import {
  clearGuestCart,
  guestBespokeItems,
  guestCartItemCount,
  guestCatalogItems,
  readGuestCart,
} from "@/lib/cart/guest-cart";
import {
  clearGuestWishlist,
  readGuestWishlist,
} from "@/lib/wishlist/guest-wishlist";
import { setWishlistedSlugsCache } from "@/lib/wishlist/wishlist-client";

type Step = "phone" | "code";

const DEFAULT_RESEND_COOLDOWN_SECONDS = 30;
const OTP_LENGTH = 6;

const STEP_COPY = {
  phone: {
    kicker: "Welcome back",
    title: "Sign in.",
    lead: "We’ll text a one-time code to your phone. No password needed. Your orders and delivery addresses stay with your number.",
  },
  code: {
    kicker: "Verify it’s you",
    title: "Enter your code.",
    lead: "We just sent a 6-digit code by SMS.",
  },
} as const;

/**
 * OTP sign-in. After verify, redirects to a safe `?next=` path, otherwise to
 * Account — the customer signed in to reach something of theirs, and Account
 * is where their orders and addresses live.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const otpInputRef = useRef<OtpInputHandle>(null);

  const next = searchParams.get("next");

  /**
   * The page already turned away anyone holding a live access cookie. What is
   * left is the customer whose 15-minute access token lapsed but whose 30-day
   * refresh is good: rotate it and let them through rather than asking for a
   * code they do not owe us.
   */
  useEffect(() => {
    let cancelled = false;

    void ensureShopSession().then((active) => {
      if (cancelled) return;
      if (active) {
        setSignedIn(true);
        router.replace(safeNext(next) ?? ACCOUNT_HOME);
        return;
      }
      setSessionChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [next, router]);

  /** Ticks the resend cooldown down to zero once a code has been sent. */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function destination(): string {
    return safeNext(next) ?? ACCOUNT_HOME;
  }

  function requestOtp(onSent: () => void) {
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
          resendAvailableInSeconds?: number;
          retryAfterSeconds?: number;
        };

        if (!response.ok) {
          setError(formatApiMessage(data.message) ?? "Could not send code");
          if (data.retryAfterSeconds) {
            setResendCooldown(data.retryAfterSeconds);
          }
          return;
        }

        setResendCooldown(
          data.resendAvailableInSeconds ?? DEFAULT_RESEND_COOLDOWN_SECONDS,
        );
        if (process.env.NODE_ENV === "development") {
          setDevHint("Check the API server logs for the OTP code.");
        }
        onSent();
      } catch {
        setError("Could not send code. Try again.");
      }
    });
  }

  function onRequestOtp(event: FormEvent) {
    event.preventDefault();
    requestOtp(() => setStep("code"));
  }

  function onResend() {
    if (resendCooldown > 0 || isPending) return;
    setCode("");
    requestOtp(() => {
      otpInputRef.current?.focus();
    });
  }

  function onChangeNumber() {
    setStep("phone");
    setCode("");
    setError(null);
    setDevHint(null);
  }

  function submitVerify(codeValue: string) {
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), code: codeValue.trim() }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          message?: string | string[];
        };

        if (!response.ok) {
          setError(formatApiMessage(data.message) ?? "Invalid code");
          setCode("");
          otpInputRef.current?.focus();
          return;
        }

        await mergeGuestCartAfterLogin();
        await mergeGuestWishlistAfterLogin();

        router.replace(destination());
        router.refresh();
      } catch {
        setError("Could not verify code. Try again.");
      }
    });
  }

  function onVerify(event: FormEvent) {
    event.preventDefault();
    submitVerify(code);
  }

  const copy = STEP_COPY[step];

  return (
    <div className="grid overflow-hidden rounded-[4px] border border-graphite/10 bg-shell shadow-[0_24px_60px_-30px_rgba(22,19,16,0.35)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <LoginAtmosphere step={step} />

      <div className="px-6 py-10 sm:px-10 sm:py-12">
        {signedIn || !sessionChecked ? (
          <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
            {signedIn
              ? "Already signed in. Taking you through…"
              : "Checking your session…"}
          </p>
        ) : (
          <>
            <p className="text-[12px] text-terra md:text-[13px]">
              {copy.kicker}
            </p>
            <h1 className="mt-1 font-editorial text-[clamp(28px,3.6vw,36px)] leading-[1.05] text-graphite">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-graphite-soft">
              {copy.lead}
            </p>

            {step === "phone" ? (
              <form onSubmit={onRequestOtp} className="mt-8 space-y-6">
                <FormField label="Mobile number" htmlFor="login-phone">
                  <PhoneField
                    id="login-phone"
                    name="phone"
                    autoComplete="tel-national"
                    required
                    autoFocus
                    value={phone}
                    onChange={setPhone}
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="ink"
                  size="lg"
                  className="w-full cursor-pointer"
                  disabled={isPending}
                >
                  {isPending ? "Sending…" : "Send code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={onVerify} className="mt-8 space-y-6">
                <p className="text-sm text-graphite-soft">
                  Code sent to{" "}
                  <span className="font-medium text-graphite">
                    {formatIndianMobileDisplay(phone)}
                  </span>
                  .{" "}
                  <button
                    type="button"
                    onClick={onChangeNumber}
                    className="cursor-pointer font-medium text-graphite underline decoration-graphite/25 underline-offset-[3px] transition-colors hover:text-terra hover:decoration-terra/50"
                  >
                    Change number
                  </button>
                </p>

                <div>
                  <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                    One-time code
                  </span>
                  <div className="mt-2.5">
                    <OtpInput
                      ref={otpInputRef}
                      length={OTP_LENGTH}
                      value={code}
                      onChange={setCode}
                      onComplete={submitVerify}
                      disabled={isPending}
                      invalid={Boolean(error)}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="ink"
                  size="lg"
                  className="w-full cursor-pointer"
                  disabled={isPending || code.replace(/\D/g, "").length < OTP_LENGTH}
                >
                  {isPending ? "Verifying…" : "Verify & continue"}
                </Button>

                <p className="text-[13px] text-graphite-faint">
                  {resendCooldown > 0 ? (
                    <>Resend code in {resendCooldown}s</>
                  ) : (
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={isPending}
                      className="cursor-pointer font-medium text-graphite-soft underline decoration-graphite/25 underline-offset-[3px] transition-colors hover:text-terra hover:decoration-terra/50 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </form>
            )}

            {devHint ? (
              <p className="mt-5 text-sm text-graphite-faint">{devHint}</p>
            ) : null}
            {error ? (
              <p className="mt-5 text-sm text-terra" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
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
    const response = await shopFetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: guestCatalogItems(guest).map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
        bespokeItems: guestBespokeItems(guest).map((line) => ({
          bespokePerfumeId: line.bespokePerfumeId,
          sizeMl: line.sizeMl,
          quantity: line.quantity,
        })),
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      cart?: { itemCount?: number };
    };
    clearGuestCart();
    emitCartChanged({
      itemCount:
        typeof data.cart?.itemCount === "number"
          ? data.cart.itemCount
          : guestCartItemCount(guest),
    });
  } catch {
    /* Keep guest cart if merge fails; user can retry next login. */
  }
}

/** Soft-merge guest wishlist slugs into the Nest wishlist after OTP verify. */
async function mergeGuestWishlistAfterLogin(): Promise<void> {
  const guest = readGuestWishlist();
  if (guest.items.length === 0) return;

  try {
    const response = await shopFetch("/api/wishlist/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slugs: guest.items.map((item) => item.slug),
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      wishlist?: { items?: { slug: string }[] };
    };
    clearGuestWishlist();
    setWishlistedSlugsCache(
      new Set(
        data.wishlist?.items?.map((item) => item.slug) ??
          guest.items.map((item) => item.slug),
      ),
    );
  } catch {
    /* Keep guest wishlist if merge fails; user can retry next login. */
  }
}
