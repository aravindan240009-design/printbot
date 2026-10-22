/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@xerox/ui', '@xerox/api-client', '@xerox/contracts'],
};

module.exports = nextConfig;
