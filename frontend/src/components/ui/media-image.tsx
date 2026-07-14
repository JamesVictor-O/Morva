"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Wraps next/image for vendor-uploaded photos, which arrive at wildly
 * inconsistent dimensions, aspect ratios, and file sizes — a phone photo
 * next to a professional 6000px studio shot. This component is what makes
 * that safe to render:
 *
 * - Locks a fixed aspect ratio on the container and uses `fill` +
 *   `object-cover`, so every source image crops cleanly into the same
 *   tile shape regardless of its own proportions. No layout shift, no
 *   stretching, no vendor photo ever breaking the grid.
 * - `sizes` tells the browser which of next/image's generated variants to
 *   fetch for the current viewport — the actual bandwidth win. A 6000px
 *   original is never sent to a 300px tile.
 * - A shimmer skeleton covers the container until the image reports
 *   loaded, so a slow vendor photo never leaves a blank hole while it
 *   fetches.
 * - `src` is optional: pass none (a merchant hasn't uploaded a photo yet)
 *   and `fallback` renders instead — this is what backs the hand-drawn
 *   stall illustrations elsewhere in the app.
 */
export function MediaImage({
  src,
  alt,
  sizes,
  aspectRatio = "4 / 3",
  priority = false,
  className = "",
  fallback,
}: {
  src?: string;
  alt: string;
  sizes: string;
  aspectRatio?: string;
  priority?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  // Local seed photos are relative paths (/stall-photos/...); real vendor
  // uploads are full Supabase Storage URLs. Remote sources skip Next's own
  // re-optimization — they're already CDN-backed, and routing them through
  // Next's image proxy hits its SSRF-protection IP check, which false-
  // positives on networks using NAT64 (DNS resolves the CDN host to a
  // synthesized 64:ff9b::/96 address that Next treats as private even
  // though it decodes to a real public IP).
  const isRemote = src?.startsWith("http");

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      {src ? (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-border-soft" />}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            quality={80}
            unoptimized={isRemote}
            onLoad={() => setLoaded(true)}
            className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : (
        fallback
      )}
    </div>
  );
}
