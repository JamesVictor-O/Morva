import { Magic } from "magic-sdk";

let instance: Magic | null | undefined;

/**
 * Magic is a browser-only SDK (it talks to an iframe) and its constructor
 * throws under SSR. Lazily building it here — instead of at module scope —
 * keeps this file safe to import from Server Components, and lets callers
 * degrade gracefully (a `null` return) when no publishable key is set rather
 * than crashing the app.
 */
export function getMagic(): Magic | null {
  if (typeof window === "undefined") return null;
  if (instance !== undefined) return instance;

  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  instance = key ? new Magic(key) : null;
  return instance;
}
