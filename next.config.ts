
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Added for static HTML export
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for 'output: export' with next/image
  },
};

export default nextConfig;
