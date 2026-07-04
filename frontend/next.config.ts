import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Modern formats first — the optimizer picks whichever the browser
    // supports via Accept headers, falling back to the original format.
    formats: ["image/avif", "image/webp"],
    // Matches the actual breakpoints/grid columns this app renders at
    // (see MediaImage's `sizes` prop usage) rather than Next's defaults,
    // so the generated srcset doesn't waste variants nobody requests.
    deviceSizes: [384, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256],
    // Next 16 allow-lists quality values (unrestricted access was a DoS
    // vector) — MediaImage always requests quality=80, so that's the only
    // value that needs to be allowed.
    qualities: [80],
    // Vendor photos live under /public/stall-photos for now (no upload
    // backend yet). Once merchant photo uploads go to a real CDN/bucket,
    // add its hostname here — next/image refuses to optimize remote
    // sources that aren't explicitly allow-listed.
    remotePatterns: [],
  },
};

export default nextConfig;
