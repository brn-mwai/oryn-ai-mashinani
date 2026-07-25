/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@oryn/database", "@oryn/payments"],
};

module.exports = nextConfig;
