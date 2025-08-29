import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // enables `next export`
  images: {
    unoptimized: true, // since GitHub Pages can’t handle Next’s Image Optimization
  },
  basePath: "/job-tracker-keywords", // https://johngaynor.github.io/job-tracker-keywords
  assetPrefix: "/job-tracker-keywords",
};

export default nextConfig;
