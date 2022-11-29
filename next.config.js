/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'its-magical.s3.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'cataas.com'
      }
    ],
  }
};

module.exports = nextConfig;
