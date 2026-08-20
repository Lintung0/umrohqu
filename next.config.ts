import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "rabbanitour.travel",
      },
      {
        protocol: "https",
        hostname: "alhijaz.id",
      },
      {
        protocol: "https",
        hostname: "pakemtours.co.id",
      },
      {
        protocol: "https",
        hostname: "cdn.ptbatik.co.id",
      },
      {
        protocol: "https",
        hostname: "*.nos.wjv-1.neo.id",
      },
      {
        protocol: "https",
        hostname: "cloud.umroh.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
