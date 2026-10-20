import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `ws` usa módulos nativos opcionais; manter fora do bundle evita erros em produção.
  serverExternalPackages: ["ws"],
};

export default nextConfig;
