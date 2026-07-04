import type { Address } from "viem";

export interface MorvaConfig {
  particle: {
    projectId: string;
    projectClientKey: string;
    projectAppUuid: string;
  };
  /** Optional until the registry contract is deployed — pass a config
   *  directly to createDirectIntent() until then. */
  registryAddress?: Address;
  /** Arbitrum One RPC. Defaults to the public Arbitrum RPC. */
  rpcUrl?: string;
  /** Basis points, default 100 (1%). */
  slippageBps?: number;
}

export const DEFAULT_ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";
export const DEFAULT_SLIPPAGE_BPS = 100;
export const ARBITRUM_ONE_CHAIN_ID = 42161;
