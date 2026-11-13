import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Local/dev: proxy /api + /uploads to the Go API (and Next Image).
  async rewrites() {
    const api = (process.env.INTERNAL_API_URL || "http://127.0.0.1:4000").replace(
      /\/$/,
      ""
    );
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
      { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.app",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.dev",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.ngrok.app",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
