export interface MerchantMetadata {
  name?: string;
  logoUrl?: string;
  description?: string;
}

const FETCH_TIMEOUT_MS = 5000;

/** Best-effort — a merchant's metadataURI is untrusted, possibly slow or
 *  offline, and never blocks reading the on-chain config it's attached
 *  to. Never throws. */
export async function fetchMerchantMetadata(
  metadataURI: string
): Promise<MerchantMetadata | undefined> {
  if (!metadataURI) return undefined;

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
