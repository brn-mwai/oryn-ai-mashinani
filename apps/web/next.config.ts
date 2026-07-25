import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oryn/auth", "@oryn/ui", "@oryn/database", "@oryn/types", "@oryn/config"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

export default nextConfig;
