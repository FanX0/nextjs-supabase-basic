import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ocxqqviymvdpjjrcgshi.supabase.co",
      },
    ],
  },
};

export default nextConfig;
