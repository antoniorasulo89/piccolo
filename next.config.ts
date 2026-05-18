import type { NextConfig } from "next";

import { ALLOWED_IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
