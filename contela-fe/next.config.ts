import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean),
  ...(process.env.ELECTRON === "1" && {
    output: "export" as const,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
