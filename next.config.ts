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
        hostname: "img.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "img10.360buyimg.com",
      },
      {
        protocol: "https",
        hostname: "img14.360buyimg.com",
      },
      {
        protocol: "https",
        hostname: "gw.alicdn.com",
      },
    ],
  },
};

export default nextConfig;
