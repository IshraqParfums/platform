/** Decorative art per collection slug, served locally so the UI never waits on Storage. */
const ART: Record<string, { src: string; alt: string }> = {
  designer: {
    src: "/products/citrus-atelier.jpg",
    alt: "Citrus Atelier perfume bottle",
  },
  nostalgia: {
    src: "/products/monsoon-letters.jpg",
    alt: "Monsoon Letters perfume bottle",
  },
  "limited-edition": {
    src: "/products/oud-ishraq.jpg",
    alt: "Oud Ishraq perfume bottle",
  },
};

const FALLBACK_ART = { src: "/products/cedar-sessions.jpg", alt: "" };

export function getCollectionArt(slug: string): { src: string; alt: string } {
  return ART[slug] ?? FALLBACK_ART;
}
