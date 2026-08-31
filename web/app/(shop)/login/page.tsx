import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { BandInner } from "@/components/home-v2/ui/band";
import { ACCOUNT_HOME } from "@/lib/auth/account-routes";
import { safeNext } from "@/lib/auth/safe-next";
import { getShopAccessToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Ishraq Parfums with a one-time code.",
};

/**
 * The door — not a second product. Someone already inside is not asked to
 * knock: a live session redirects before any form renders.
 *
 * A session whose access cookie has merely lapsed still reaches this markup,
 * because a server component cannot see the refresh cookie (path-scoped to
 * `/api/auth`). `LoginForm` catches that case on the client, rotates the
 * session and leaves without showing the form.
 *
 * Plain `<section>` + `BandInner`, matching checkout/account's page shell —
 * `/login` is a paper route now (see `isPaperStorefrontPath` in lib/layout.ts).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  if (await getShopAccessToken()) {
    redirect(safeNext(next) ?? ACCOUNT_HOME);
  }

  return (
    <section className="bg-paper py-10 pb-20 md:py-16 md:pb-28">
      <BandInner width="form">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </BandInner>
    </section>
  );
}

function LoginFormFallback() {
  return (
    <div className="grid overflow-hidden rounded-[4px] border border-graphite/10 bg-shell shadow-[0_24px_60px_-30px_rgba(22,19,16,0.35)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="hidden min-h-[32rem] bg-tobacco lg:block" />
      <div className="animate-pulse px-6 py-10 sm:px-10 sm:py-12">
        <div className="h-3 w-24 bg-graphite/10" />
        <div className="mt-3 h-9 w-40 bg-graphite/10" />
        <div className="mt-8 h-11 w-full max-w-sm bg-graphite/5" />
      </div>
    </div>
  );
}
