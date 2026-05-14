import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // Tắt hoàn toàn Dev Indicators (Next.js 15 syntax)
  output: "standalone",
};

export default nextConfig;
