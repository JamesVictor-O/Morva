import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Stall/product photo uploads go through Server Actions as
      // multipart FormData (see actions/stalls.ts, actions/products.ts) —
      // Next's default 1MB cap rejects most real photos. 10mb comfortably
      // covers a phone photo without leaving the limit wide open.
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    resolveAlias: {
      // @particle-network/universal-account-sdk ships an obfuscated CJS
      // build (dist/index.cjs) alongside a clean ESM one (dist/index.mjs).
      // Turbopack's browser resolution of the bare specifier picks the CJS
      // build and its interop layer can't statically recover named exports
      // from the obfuscated source, producing an empty module at runtime
      // (confirmed live: plain Node's dynamic import() of the bare
      // specifier correctly resolves the .mjs build via the package's
      // "exports"."import" condition — this is a Turbopack resolution
      // quirk, not a package or Node problem). Force the known-good ESM
      // file directly.
      "@particle-network/universal-account-sdk": "@particle-network/universal-account-sdk/dist/index.mjs",
    },
  },
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
    // Seeded demo photos live under /public/stall-photos (local, no
    // allow-listing needed). Real merchant uploads (src/lib/storage.ts) go
    // to Supabase Storage instead — next/image refuses to optimize remote
    // sources that aren't explicitly allow-listed here.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
