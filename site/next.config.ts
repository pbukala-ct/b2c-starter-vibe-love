import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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

export default withNextIntl(nextConfig);
