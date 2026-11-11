import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/dashboard',
  allowedDevOrigins: ['http://43.133.139.91:3000'],
  async rewrites() {
    return [
      {
        source: '/graph-api/:path*',
        destination: 'http://localhost:8765/:path*',
      },
    ]
  },
};

export default nextConfig;
