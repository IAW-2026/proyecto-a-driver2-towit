import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  allowedDevOrigins: ['192.168.0.17'],
  images: {
    remotePatterns: [new URL('https://img.clerk.com/**')]
  }
}

export default nextConfig;
