/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets `npm run build` run while `next dev` holds the default .next folder (set NEXT_DIST_DIR=.next-build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "**.onrender.com" },
    ],
  },
};

export default nextConfig;
