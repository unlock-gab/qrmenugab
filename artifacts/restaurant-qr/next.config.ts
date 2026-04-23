import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  allowedDevOrigins: ["*.worf.replit.dev", "*.replit.dev", "*.repl.co"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.worf.replit.dev", "*.replit.dev", "*.repl.co", "localhost"],
    },
  },
};

export default nextConfig;
