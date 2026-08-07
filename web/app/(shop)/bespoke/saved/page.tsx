import type { Metadata } from "next";
import { BespokeSavedClient } from "@/components/bespoke/bespoke-saved-client";

export const metadata: Metadata = {
  title: "Saved blends",
  description: "Your saved Ishraq bespoke formulas.",
};

export default function BespokeSavedPage() {
  return <BespokeSavedClient />;
}
