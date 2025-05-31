import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["static.usernames.app-backend.toolsforhumanity.com"],
  },
  allowedDevOrigins: ["*", "5040-195-113-187-136.ngrok-free.app"], // Add your dev origin here
  reactStrictMode: false,
};

export default nextConfig;
