/** Shared motion constants — every animated component in the landing page
 *  pulls from here so timing/easing stays consistent instead of each
 *  section inventing its own numbers. */

/** cubic-bezier(0.22, 1, 0.36, 1) — the "premium" ease-out used across every
 *  duration-based (non-spring) animation on the page. */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
export const EASE_PREMIUM_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

export const SPRING = {
  /** Hero mount elements — crisp, settles fast, no over-travel. */
  stiff: { type: "spring", stiffness: 350, damping: 28 } as const,
  /** Cards arriving on scroll — enough bounce to read as "physical". */
  bouncy: { type: "spring", stiffness: 280, damping: 22 } as const,
  /** Idle floating loops — soft, slow, never mechanical. */
  soft: { type: "spring", stiffness: 120, damping: 18, mass: 1 } as const,
};

export const DURATION = {
  micro: 0.15,
  short: 0.25,
  base: 0.35,
  slow: 0.6,
};

/** Hero entrance cascade — see Hero()'s ASCII storyboard in page.tsx. */
export const HERO_TIMING = {
  eyebrow: 0,
  wordmark: 150,
  image: 350,
  ctas: 600,
  meta: 750,
};
