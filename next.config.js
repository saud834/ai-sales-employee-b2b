/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3", "archiver"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
