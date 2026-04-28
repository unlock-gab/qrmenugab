import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Production domain(s) — set APP_DOMAIN env var in Dokploy (e.g. "qrmenu.example.com")
const appDomain = process.env.APP_DOMAIN || "";
const productionOrigins = appDomain ? [appDomain, `www.${appDomain}`] : [];

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 128, 256, 384],
  },
  ...(isDev && {
    allowedDevOrigins: ["*.worf.replit.dev", "*.replit.dev", "*.repl.co"],
  }),
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost",
        "127.0.0.1",
        ...(isDev ? ["*.worf.replit.dev", "*.replit.dev", "*.repl.co"] : []),
        ...productionOrigins,
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/favicon.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
