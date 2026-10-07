/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production build only: NEXT_DIST_DIR=.next-build avoids clashing with a running dev server.
  // Dev always uses `.next` so the browser never requests stale layout chunks.
  distDir:
    process.env.NEXT_DIST_DIR && process.env.npm_lifecycle_event === "build"
      ? process.env.NEXT_DIST_DIR
      : ".next",
  images: {
    minimumCacheTTL: 86400,
    deviceSizes: [384, 640, 750, 828, 1080],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.up.railway.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
