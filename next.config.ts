import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.baidu.com",
      },
      {
        protocol: "https",
        hostname: "*.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "*.jd.com",
      },
      {
        protocol: "https",
        hostname: "*.tmall.com",
      },
    ],
  },
};

export default nextConfig;
