import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["26.115.166.11", "192.168.100.4"],
  ...(process.env.ELECTRON === "1" && {
    output: "export" as const,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
