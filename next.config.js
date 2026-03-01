/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix Server Actions origin issues for browser preview
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
