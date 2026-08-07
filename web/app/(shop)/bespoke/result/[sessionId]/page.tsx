import type { Metadata } from "next";
import { BespokeResultClient } from "@/components/bespoke/bespoke-result-client";

export const metadata: Metadata = {
  title: "Your bespoke blend",
};

export default function BespokeResultPage() {
  return <BespokeResultClient />;
}
