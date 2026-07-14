"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Entrance trajectories a card can travel along — each reads as a
 *  distinct "personality" while sharing the same physics. Values are the
 *  FROM state; every variant animates TO {x:0, y:0, rotate:0, scale:1,
 *  opacity:1}. */
const VARIANTS = {
  /** Straight rise — used for single-column text blocks (Thesis, FinalCta). */
  up: { x: 0, y: 42, rotate: 0, scale: 0.96 },
  /** Drifts in from the lower-left, slight counter-clockwise rotation. */
  left: { x: -56, y: 30, rotate: -4, scale: 0.92 },
  /** Drifts in from the lower-right, slight clockwise rotation. */
  right: { x: 56, y: 30, rotate: 4, scale: 0.92 },
  /** Larger diagonal travel with more rotation — for the one "hero" card in
   *  a group that should feel like it's arriving from further away. */
  converge: { x: -90, y: 46, rotate: -6, scale: 0.9 },
} as const;

export type ScrollRevealVariant = keyof typeof VARIANTS;

/**
 * Animates children into place as they scroll into view, along a curved
 * (diagonal + rotate + scale, not a straight fade-up) trajectory with a
 * slight overshoot before settling — back.out easing overshoots past 1 on
 * scale/position before relaxing back, which reads as "physical" rather
 * than a mechanical linear arrival. `index` staggers the start time and
 * seeds a small jitter so a group of cards never lands in perfect unison.
 *
 * Replays every time the element crosses into/out of view in either
 * scroll direction (toggleActions: restart/reverse) — not a once-per-page
 * reveal. Scrolling back up past a section and back down to it plays the
 * entrance again, same as scrolling past it the first time.
 */
export function ScrollReveal({
  children,
  variant = "up",
  index = 0,
  stagger = 0.12,
  className,
}: {
  children: React.ReactNode;
  variant?: ScrollRevealVariant;
  index?: number;
  stagger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = VARIANTS[variant];

      if (reduceMotion) {
        gsap.set(ref.current, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 });
        return;
      }

      // Deterministic per-index jitter (not Math.random()) — varies the
      // stagger slightly so cards in the same group don't feel robotic,
      // without producing a different animation on every re-render.
      const jitter = ((index * 37) % 11) / 100; // 0.00-0.10s

      gsap.fromTo(
        ref.current,
        { opacity: 0, ...from },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          duration: 0.9,
          delay: index * stagger + jitter,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 88%",
            end: "bottom 15%",
            toggleActions: "restart reverse restart reverse",
          },
        }
      );
    },
    { scope: ref, dependencies: [variant, index, stagger] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
