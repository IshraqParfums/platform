"use client";

import { PerfumeSlider } from "@/components/perfume-slider-v2";
import type { Perfume } from "@/components/perfume-slider-v2";

export function GallerySlider({ perfumes }: { perfumes: Perfume[] }) {
  return <PerfumeSlider className="flex-1" perfumes={perfumes} />;
}

export default GallerySlider;
