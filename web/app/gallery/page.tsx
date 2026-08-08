import type { Metadata } from "next";
import { getGalleryPerfumes } from "@/lib/gallery/perfumes";

import { GallerySlider } from "./GallerySlider";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Slide through the collection — turn a bottle toward you and spray it on the glass.",
};

export default async function GalleryPage() {
  const perfumes = await getGalleryPerfumes();

  return (
    <main className="flex flex-1 flex-col">
      <GallerySlider perfumes={perfumes} />
    </main>
  );
}
