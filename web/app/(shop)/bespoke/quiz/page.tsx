import type { Metadata } from "next";
import { BespokeQuizClient } from "@/components/bespoke/bespoke-quiz-client";

export const metadata: Metadata = {
  title: "Bespoke quiz",
  description: "Fifteen questions. None of them about perfume.",
};

export default function BespokeQuizPage() {
  return <BespokeQuizClient />;
}
