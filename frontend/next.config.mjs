/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production build only: NEXT_DIST_DIR=.next-build avoids clashing with a running dev server.
  // Dev always uses `.next` so the browser never requests stale layout chunks.
  distDir:
    process.env.NEXT_DIST_DIR && process.env.npm_lifecycle_event === "build"
      ? process.env.NEXT_DIST_DIR
      : ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
