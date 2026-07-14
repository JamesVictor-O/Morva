export interface MerchantMetadata {
  name?: string;
  logoUrl?: string;
  description?: string;
}

const FETCH_TIMEOUT_MS = 5000;

// Hostname literals that route to loopback, private, or link-local ranges —
// notably 169.254.169.254, the cloud metadata endpoint SSRF payloads target.
// This is a literal-only check: it doesn't resolve hostnames, so a domain
// name that *resolves* to one of these ranges (DNS rebinding) isn't caught.
// That's an inherent limit of filtering in front of the platform fetch()
// rather than controlling the connection itself.
const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?f[cd][0-9a-f]{0,2}:/i,
];

function isSafeMetadataUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  return !BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(url.hostname));
}

/** Best-effort — a merchant's metadataURI is untrusted, possibly slow,
 *  offline, or pointed at an internal address, and never blocks reading the
 *  on-chain config it's attached to. Never throws. */
export async function fetchMerchantMetadata(
  metadataURI: string
): Promise<MerchantMetadata | undefined> {
  if (!metadataURI || !isSafeMetadataUrl(metadataURI)) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(metadataURI, { signal: controller.signal });
    if (!res.ok) return undefined;

    const json = (await res.json()) as Record<string, unknown>;
    return {
      name: typeof json.name === "string" ? json.name : undefined,
      logoUrl: typeof json.logoUrl === "string" ? json.logoUrl : undefined,
      description: typeof json.description === "string" ? json.description : undefined,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
