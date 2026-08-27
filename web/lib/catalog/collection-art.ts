/** Decorative art per collection slug, served locally so the UI never waits on Storage. */
const ART: Record<string, { src: string; alt: string }> = {
  designer: {
    src: "/products/citrus-atelier.webp",
    alt: "Citrus peel and green leaves on parchment",
  },
  nostalgia: {
    src: "/products/monsoon-letters.webp",
    alt: "Rain-dark paper, tea, and wet wood",
  },
  "limited-edition": {
    src: "/products/oud-ishraq-1.webp",
    alt: "Agarwood chips, saffron, and dark resin",
  },
};

const FALLBACK_ART = {
  src: "/products/cedar-sessions.webp",
  alt: "Dry cedar and vetiver roots",
};

export function getCollectionArt(slug: string): { src: string; alt: string } {
  return ART[slug] ?? FALLBACK_ART;
}
