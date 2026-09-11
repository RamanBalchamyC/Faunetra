import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the "N" dev-mode indicator badge Next.js overlays in a corner
  // during local development — purely a dev tool, not part of the app UI.
  devIndicators: false,
};

export default nextConfig;
