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
  /** Block getAllMerchants() starts scanning MerchantRegistered logs from —
   *  required to call getAllMerchants() (RegistryDeploymentBlockRequired
   *  otherwise). Most RPC providers reject or throttle unbounded getLogs
   *  ranges, so this deliberately has no usable default; set it to the
   *  block MorvaRegistry was deployed at. */
  registryDeploymentBlock?: bigint;
  /** Arbitrum One RPC. Defaults to the public Arbitrum RPC. */
  rpcUrl?: string;
  /** Basis points, default 100 (1%). */
  slippageBps?: number;
  /** How long session.pay() polls for settlement before throwing
   *  SettlementTimeout. Default 120_000ms. */
  settlementTimeoutMs?: number;
}

export const DEFAULT_ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";
export const DEFAULT_SLIPPAGE_BPS = 100;
export const DEFAULT_SETTLEMENT_TIMEOUT_MS = 120_000;
export const ARBITRUM_ONE_CHAIN_ID = 42161;
/** Deliberately an unsafe sentinel, not a real default — getAllMerchants()
 *  refuses to run (RegistryDeploymentBlockRequired) while
 *  registryDeploymentBlock is still this value, rather than silently
 *  scanning MerchantRegistered logs from genesis. */
export const DEFAULT_REGISTRY_DEPLOYMENT_BLOCK = 0n;
