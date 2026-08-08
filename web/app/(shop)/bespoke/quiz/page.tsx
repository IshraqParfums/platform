import type { Metadata } from "next";
import { Suspense } from "react";
import { BespokeQuizClient } from "@/components/bespoke/bespoke-quiz-client";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Bespoke quiz",
  description: "Fifteen questions. None of them about perfume.",
};

export default function BespokeQuizPage() {
  return (
    <Suspense
      fallback={
        <Container size="narrow" className="py-12">
          <p className="text-ink-soft">Loading…</p>
        </Container>
      }
    >
      <BespokeQuizClient />
    </Suspense>
  );
}
