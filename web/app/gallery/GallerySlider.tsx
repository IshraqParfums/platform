"use client";

import { PerfumeSlider } from "@/components/perfume-slider";
import type { Perfume } from "@/components/perfume-slider";

export function GallerySlider({ perfumes }: { perfumes: Perfume[] }) {
  return <PerfumeSlider className="flex-1" perfumes={perfumes} />;
}

export default GallerySlider;
