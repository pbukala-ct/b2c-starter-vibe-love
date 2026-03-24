import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/merchant-center-europe/**',
      },
      {
        protocol: 'https',
        hostname: 'images.cdn.europe-west1.gcp.commercetools.com',
      },
    ],
  },
};

export default nextConfig;
