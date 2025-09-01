import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // enables `next export`
  images: {
    unoptimized: true, // GitHub Pages can’t handle Next’s Image Optimization
  },
  basePath: "", // remove repo-specific path
  assetPrefix: "", // remove repo-specific path
};

export default nextConfig;
