import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Ishraq Parfums with a one-time code.",
};

export default function LoginPage() {
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
