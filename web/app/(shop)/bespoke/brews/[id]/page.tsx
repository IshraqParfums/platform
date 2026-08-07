import type { Metadata } from "next";
import { BespokeBrewClient } from "@/components/bespoke/bespoke-brew-client";

export const metadata: Metadata = {
  title: "Your blend",
  description: "Open a saved Ishraq bespoke formula.",
};

export default function BespokeBrewPage() {
  return <BespokeBrewClient />;
}
