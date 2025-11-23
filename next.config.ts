import type { NextConfig } from "next";

const backend = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${backend}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
