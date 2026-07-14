import type { Address } from "viem";
import type { ChainHolding, UnifiedBalance } from "./types";
import { chainMeta } from "./chain-meta";

// PINNED: @particle-network/universal-account-sdk@2.0.3 — same exact
// version as sdk/src/ua/account.ts and sdk/src/ua/balance.ts, for the same
// reason: the package is mid-migration to a V2 API surface, so every type
// used here is read off this version's .d.ts, not the public docs. Bump
// this and the backend SDK's pin together, by hand.
//
// Imported dynamically (never a static top-level import) because this
// package isn't safe to evaluate during SSR — Next.js still evaluates a
// client component's module graph on the server for the initial render,
// and this file is reachable from there through AuthContext. A static
// import crashed every server-rendered page with "Cannot read properties
// of undefined (reading 'ETHEREUM_MAINNET')" from deep inside the SDK's
// bundle. Deferring the import to actual call time — which only ever
// happens client-side, from AuthContext's effects/callbacks — sidesteps it
// entirely. Type-only imports below are erased at compile time and don't
// have this problem.
import type { IAssetsResponse, UniversalAccount as UniversalAccountType } from "@particle-network/universal-account-sdk";

/** True once the Particle env vars needed to construct a Universal Account
 *  are actually set — lets callers degrade gracefully instead of throwing
 *  when local dev hasn't configured them yet. */
export function particleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY &&
      process.env.NEXT_PUBLIC_PARTICLE_APP_ID
  );
}

/** Constructs the buyer's Universal Account in EIP-7702 mode — the owner
 *  EOA (here, the address of the Magic embedded wallet) becomes the
 *  account in place, at the same address. Read-only balance lookups need
 *  nothing more than this address; no signer is required until checkout
 *  actually needs to authorize a transaction. */
async function createUniversalAccount(ownerAddress: Address): Promise<UniversalAccountType> {
  // Resolves via next.config.ts's turbopack.resolveAlias, which forces this
  // specifier to the package's ESM build directly — see that config entry
  // for why (Turbopack's default browser resolution of the bare specifier
  // picks the package's obfuscated CJS build instead, which loses its
  // named exports in Turbopack's browser interop layer).
  const { UniversalAccount, UNIVERSAL_ACCOUNT_VERSION } = await import("@particle-network/universal-account-sdk");
  return new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
    smartAccountOptions: {
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress,
      useEIP7702: true,
    },
  });
}

/** Maps Particle's getPrimaryAssets() response — grouped by asset, each
 *  with a per-chain breakdown — into the flat per-chain USD totals the
 *  buyer-facing UI (BalancePill, the checkout page) actually displays. Unlike
 *  sdk/src/ua/balance.ts's UnifiedBalance (which keeps the per-asset shape
 *  for SDK consumers), this collapses straight to chains because that's
 *  the only view this app's UI has ever needed. */
function toUnifiedBalance(raw: IAssetsResponse): UnifiedBalance {
  const perChainUsd = new Map<number, number>();
  for (const asset of raw.assets) {
    for (const agg of asset.chainAggregation) {
      const chainId = agg.token.chainId;
      perChainUsd.set(chainId, (perChainUsd.get(chainId) ?? 0) + agg.amountInUSD);
    }
  }

  const chains: ChainHolding[] = Array.from(perChainUsd.entries())
    .filter(([, amountUsd]) => amountUsd > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([chainId, amountUsd]) => ({ chainId, amountUsd, ...chainMeta(chainId) }));

  return { totalUsd: raw.totalAmountInUSD, chains };
}

export async function fetchUnifiedBalance(ownerAddress: Address): Promise<UnifiedBalance> {
  const ua = await createUniversalAccount(ownerAddress);
  const raw = await ua.getPrimaryAssets();
  return toUnifiedBalance(raw);
}
