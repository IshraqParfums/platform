/**
 * Build outbound share URLs for common channels.
 * Keep channel list here so ProductShare stays UI-only.
 */
export function buildShareLinks(title: string, url: string) {
  const text = `${title} — ${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`,
  } as const;
}

export type ShareChannel = keyof ReturnType<typeof buildShareLinks>;
