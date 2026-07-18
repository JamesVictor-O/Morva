import type { Address } from "viem";
import { UNIVERSAL_ACCOUNT_VERSION, UniversalAccount } from "@particle-network/universal-account-sdk";
import { DEFAULT_SLIPPAGE_BPS, type MorvaConfig } from "../config";

// PINNED: @particle-network/universal-account-sdk@2.0.3 (pinned, no `^`,
// as of 2026-07-05). Universal Accounts is mid-migration to a V2 API
// surface — every type this SDK imports from it (IUserOpWithChain,
// EIP7702Authorization, IAssetsResponse, etc.) is read directly off this
// exact version's .d.ts, not from memory of the public docs. Bumping it
// requires re-checking those types by hand, not just a routine upgrade.

/** Always constructs the UA in EIP-7702 mode — the owner EOA becomes the
 *  Universal Account in place, at the same address. No ERC-4337-default
 *  (separate counterfactual smart account address) path exists in this SDK. */
export function createUniversalAccount(config: MorvaConfig, ownerAddress: Address): UniversalAccount {
  return new UniversalAccount({
    projectId: config.particle.projectId,
    projectClientKey: config.particle.projectClientKey,
    projectAppUuid: config.particle.projectAppUuid,
    smartAccountOptions: {
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress,
      useEIP7702: true,
    },
    tradeConfig: {
      slippageBps: config.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    },
    // Deliberately not wired to MorvaConfig's registryRpcUrl/
    // settlementRpcUrls: this constructor's own `rpcUrl` field is not a
    // blockchain node endpoint — it's the endpoint the pinned Particle
    // SDK posts its own `universal_*` backend RPC calls to internally
    // (defaults to https://universal-rpc-proxy.particle.network), a
    // completely different concept from an Arbitrum/Base/etc. JSON-RPC
    // node. Confirmed by reading the pinned 2.0.3 build directly, since
    // this isn't documented. Passing our own chain RPC here would
    // silently redirect Particle's own backend calls to the wrong place.
  });
}
