import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ishraqparfums/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aupwaopttdwtjanyywrn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
