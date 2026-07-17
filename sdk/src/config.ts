import type { Address } from "viem";

/** Canonical, natively-issued or Circle/Tether-attested 1:1 USD-pegged
 *  stablecoins on Arbitrum One. Used only to gate the pay() pre-flight
 *  balance check (see ua/pay.ts) — that check compares a USD balance
 *  against a raw settlementToken amount, which is only valid when one
 *  unit of the token is worth ~$1. For any other settlementToken (ETH,
 *  WETH, an NFT-collection token, etc.) the check is skipped and
 *  insufficient funds are instead surfaced by the transfer attempt
 *  itself, wrapped in the usual MorvaSdkError. */
export const ARBITRUM_USD_STABLECOINS: ReadonlySet<string> = new Set(
  [
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC (native)
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC", // USDC.e (bridged)
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb", // USDT
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da", // DAI
  ].map((address) => address.toLowerCase())
);

export function isUsdPeggedStablecoin(token: Address): boolean {
  return ARBITRUM_USD_STABLECOINS.has(token.toLowerCase());
}

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
