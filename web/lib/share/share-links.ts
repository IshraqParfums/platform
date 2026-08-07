import type { SharePayload } from "@/lib/share/share-payload";

/**
 * Build outbound share URLs for common channels from a SharePayload.
 * Keep channel list here so ShareButton stays UI-only.
 */
export function buildShareLinks(payload: SharePayload) {
  const { title, text, url } = payload;
  const body = `${text}\n\n${url}`;

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(body)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
  } as const;
}

export type ShareChannel = keyof ReturnType<typeof buildShareLinks>;
