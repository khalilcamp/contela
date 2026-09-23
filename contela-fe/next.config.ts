import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean),
  ...((process.env.ELECTRON === "1" || process.env.NEXT_OUTPUT_EXPORT === "1") && {
    output: "export" as const,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
