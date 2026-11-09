import type { NextConfig } from "next";

// EXPORT_MODE=gh-pages → static export for GitHub Pages (served from /typeflow/)
// default            → standalone server build (Vercel, VPS, etc.)
const isExport = process.env.EXPORT_MODE === "gh-pages";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        basePath: "/typeflow",
        trailingSlash: true,
      }
    : { output: "standalone" as const }),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
