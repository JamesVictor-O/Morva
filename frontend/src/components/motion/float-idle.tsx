"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Wraps decorative elements in a continuous, gentle idle float — tiny
 *  translateY + rotate, mirrored back and forth forever. `seed` staggers
 *  the phase/amplitude between instances so multiple floating elements on
 *  the same page never move in lockstep (which reads as robotic). GPU-only
 *  transforms (translate/rotate), no layout properties. */
export function FloatIdle({
  children,
  seed = 0,
  className,
}: {
  children: React.ReactNode;
  seed?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const amplitude = 6 + (seed % 3) * 2; // 6-10px
  const rotation = 1.5 + (seed % 2) * 1; // 1.5-2.5deg
  const duration = 4.5 + (seed % 4) * 0.6; // 4.5-6.9s

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0, amplitude * 0.6, 0],
        rotate: [0, rotation, 0, -rotation * 0.7, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: (seed % 5) * 0.2,
      }}
    >
      {children}
    </motion.div>
  );
}
