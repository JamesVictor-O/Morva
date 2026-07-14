import { Magic } from "magic-sdk";
import type { EthNetworkName } from "magic-sdk";

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
  // Deliberately left unset unless `NEXT_PUBLIC_MAGIC_NETWORK` is provided:
  // a mismatched network here isn't a graceful fallback, it's a hard config
  // error from Magic's own hosted UI (`auth.magic.link/send/error/config`)
  // that blocks sign-in entirely — confirmed live against this project's
  // key. Only set the env var once you've checked it matches the network
  // configured for this publishable key in the Magic dashboard.
  const network = process.env.NEXT_PUBLIC_MAGIC_NETWORK as EthNetworkName | undefined;
  instance = key ? new Magic(key, network ? { network } : undefined) : null;
  return instance;
}
