import type { Metadata } from "next";

import { PerfumeSlider } from "@/components/perfume-slider";

export const metadata: Metadata = {
  title: "The Collection · Ishraq Parfums",
  description:
    "Slide through the Ishraq Parfums collection — every bottle sprays as it arrives.",
};

export default function CollectionPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PerfumeSlider className="flex-1" />
    </main>
  );
}
