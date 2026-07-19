import type { NextConfig } from "next";

const r2AssetUrl =
  process.env.NEXT_PUBLIC_R2_ASSET_URL?.trim() ||
  process.env.R2_PUBLIC_URL?.trim() ||
  process.env.R2_PUBLIC_BASE_URL?.trim() ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim();
let r2Hostname = "";
if (r2AssetUrl) {
  try {
    r2Hostname = new URL(r2AssetUrl).hostname;
  } catch {
    r2Hostname = "";
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: r2Hostname
      ? [
          {
            protocol: "https",
            hostname: r2Hostname,
            pathname: "/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
