import type { NextConfig } from "next";

type RemotePattern = {
  protocol: "https";
  hostname: string;
  pathname: string;
};

function hostnameFromUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value.trim()).hostname;
  } catch {
    return null;
  }
}

/**
 * Build `images.remotePatterns` from env so each Supabase project works without
 * editing next.config. Seed placeholders stay allowed for local/demo catalog.
 *
 * - NEXT_PUBLIC_SUPABASE_URL → Storage public objects on that project host
 * - IMAGE_REMOTE_HOSTS → comma-separated extra hosts (optional)
 * - placehold.co → always allowed (prisma seed image URLs)
 */
function buildImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    {
      protocol: "https",
      hostname: "placehold.co",
      pathname: "/**",
    },
  ];

  const hosts = new Set<string>();

  const supabaseHost = hostnameFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (supabaseHost) hosts.add(supabaseHost);

  for (const part of (process.env.IMAGE_REMOTE_HOSTS ?? "").split(",")) {
    const host = part.trim();
    if (host) hosts.add(host);
  }

  for (const hostname of hosts) {
    patterns.push({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    });
  }

  return patterns;
}

const nextConfig: NextConfig = {
  transpilePackages: ["@ishraqparfums/shared"],
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
};

export default nextConfig;
