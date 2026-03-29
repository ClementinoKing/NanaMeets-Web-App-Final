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
};

export default nextConfig;
