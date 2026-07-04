import type { Accent } from "@/lib/types";

/** Tailwind class pairs for each stall accent color, matching the design's
 *  bg/fg tile pattern used for stall icons, product image placeholders, and
 *  buyer-initial avatars. */
export function accentClasses(accent: Accent): { bg: string; fg: string } {
  switch (accent) {
    case "purple":
      return { bg: "bg-accent-purple-bg", fg: "text-accent-purple-fg" };
    case "green":
      return { bg: "bg-accent-green-bg", fg: "text-accent-green-fg" };
    case "yellow":
      return { bg: "bg-accent-yellow-bg", fg: "text-accent-yellow-fg" };
    case "peach":
      return { bg: "bg-accent-peach-bg", fg: "text-accent-peach-fg" };
    case "beige":
      return { bg: "bg-accent-beige-bg", fg: "text-accent-beige-fg" };
  }
}
