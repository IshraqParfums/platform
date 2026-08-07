/**
 * Next.js image optimizer refuses hosts that DNS-resolve to private IPs
 * (common with Supabase + local DNS/NAT64). Load those URLs in the browser.
 */
export function shouldUnoptimizeImageSrc(src: string): boolean {
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  return src.startsWith("http://") || src.startsWith("https://");
}
