import type { NextConfig } from "next";

// Páginas removidas no redesign apontam para a página ao vivo, para não quebrar favoritos.
const REMOVED_PAGES = ["/timing", "/multiview", "/telemetry", "/race-control", "/settings"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["ws"],
  async redirects() {
    return REMOVED_PAGES.map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
