import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
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
    <Section space="compact" className="!pt-10 md:!pt-14">
      <Container size="narrow">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </Container>
    </Section>
  );
}

function LoginFormFallback() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="h-9 w-40 bg-ink/5" />
      <div className="mt-4 h-12 w-full max-w-sm bg-ink/5" />
    </div>
  );
}
