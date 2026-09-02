import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from "@/lib/storage/safe-storage";

export type ReviewDraft = {
  slug: string;
  rating: number;
  body: string;
};

const KEY_PREFIX = "ishraq:review-draft:";

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

export function saveReviewDraft(draft: ReviewDraft): void {
  safeStorageSet("session", keyFor(draft.slug), JSON.stringify(draft));
}

export function readReviewDraft(slug: string): ReviewDraft | null {
  const raw = safeStorageGet("session", keyFor(slug));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ReviewDraft;
    if (
      typeof parsed.slug !== "string" ||
      typeof parsed.rating !== "number" ||
      parsed.slug !== slug
    ) {
      return null;
    }
    return {
      slug: parsed.slug,
      rating: parsed.rating,
      body: typeof parsed.body === "string" ? parsed.body : "",
    };
  } catch {
    return null;
  }
}

export function clearReviewDraft(slug: string): void {
  safeStorageRemove("session", keyFor(slug));
}
