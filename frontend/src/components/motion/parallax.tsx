"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Continuously ties an element's vertical position to scroll progress
 * through its own container (`scrub: true`, not a one-shot reveal) — the
 * depth cue behind "foreground moves faster than background". Positive
 * `speed` moves the element down relative to scroll (background-like,
 * slower-feeling); negative moves it up (foreground-like, faster-feeling).
 * Kept to translateY only — GPU-cheap, never triggers layout.
 */
export function Parallax({
  children,
  speed = -30,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        ref.current,
        { y: -speed },
        {
          y: speed,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    },
    { scope: ref, dependencies: [speed] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
