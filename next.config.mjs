import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.basehub.com",
      },
      {
        protocol: "https",
        hostname: "basehub.earth",
      },
    ],
  },
  webpack: (config) => {
    // Alias basehub to stubs when basehub SDK isn't configured
    const stubsDir = path.resolve(__dirname, "lib/basehub-stubs");
    config.resolve.alias = {
      ...config.resolve.alias,
      "basehub": path.resolve(stubsDir, "index.ts"),
      "basehub/events": path.resolve(stubsDir, "events.ts"),
      "basehub/react-icon": path.resolve(stubsDir, "react-icon.tsx"),
      "basehub/next-image": path.resolve(stubsDir, "next-image.tsx"),
      "basehub/next-toolbar": path.resolve(stubsDir, "next-toolbar.tsx"),
      "basehub/react-rich-text": path.resolve(stubsDir, "react-rich-text.tsx"),
      "basehub/react-search": path.resolve(stubsDir, "react-search.tsx"),
      "basehub/react-code-block": path.resolve(stubsDir, "react-code-block.tsx"),
    };
    return config;
  },
};

export default nextConfig;
