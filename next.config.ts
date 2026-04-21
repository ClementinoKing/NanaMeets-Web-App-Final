import type { NextConfig } from "next";

const r2PublicBase = process.env.R2_PUBLIC_BASE;

const r2ImagePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https" as const,
    hostname: "**.r2.dev",
  },
];

if (r2PublicBase) {
  const { protocol, hostname } = new URL(r2PublicBase);

  r2ImagePatterns.push({
    protocol: protocol.replace(":", "") as "http" | "https",
    hostname,
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2ImagePatterns,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
