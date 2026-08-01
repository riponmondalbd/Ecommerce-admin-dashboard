import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${baseUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
