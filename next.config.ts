import type { NextConfig } from "next";

const backend = process.env.BACKEND_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${backend}/auth/:path*`,
      },
      {
        source: "/notes/:path*",
        destination: `${backend}/notes/:path*`,
      },
    ];
  },
};

export default nextConfig;
