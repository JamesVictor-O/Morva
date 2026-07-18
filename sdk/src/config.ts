import type { Address } from "viem";
import { arbitrum, base, bsc, mainnet, xLayer, type Chain } from "viem/chains";

/** Every settlement chain this SDK supports today. This is a subset of
 *  what Particle's Universal Account SDK itself supports (its CHAIN_ID
 *  enum also includes SOLANA_MAINNET) — Solana is deliberately excluded
 *  here because this SDK forces EIP-7702 mode (see ua/account.ts), and
 *  EIP-7702 is an Ethereum-family authorization standard with no Solana
 *  equivalent, so a Universal Account in this mode can never settle
 *  there. These five values are real EVM chain ids, and happen to match
 *  Particle's own CHAIN_ID enum numerically 1:1 — no separate mapping
 *  table needed when calling createTransferTransaction(). */
export const SUPPORTED_SETTLEMENT_CHAIN_IDS = [1, 56, 8453, 196, 42161] as const;
export type SupportedSettlementChainId = (typeof SUPPORTED_SETTLEMENT_CHAIN_IDS)[number];

export function isSupportedSettlementChainId(chainId: number): chainId is SupportedSettlementChainId {
  return (SUPPORTED_SETTLEMENT_CHAIN_IDS as readonly number[]).includes(chainId);
}

/** Arbitrum One is the default — not because it's the only option, but
 *  because it's the chain this SDK's own reference integration (Morva
 *  Plaza) settles to, and a sensible zero-config starting point (low
 *  gas, high stablecoin liquidity). Callers pass settlementChainId
 *  explicitly to settle anywhere else in SUPPORTED_SETTLEMENT_CHAIN_IDS. */
export const DEFAULT_SETTLEMENT_CHAIN_ID: SupportedSettlementChainId = 42161;
/** @deprecated Use DEFAULT_SETTLEMENT_CHAIN_ID. Kept as an alias so
 *  `typeof ARBITRUM_ONE_CHAIN_ID` references elsewhere in the codebase
 *  don't need to change independently of this file. */
export const ARBITRUM_ONE_CHAIN_ID = DEFAULT_SETTLEMENT_CHAIN_ID;

const SETTLEMENT_VIEM_CHAINS: Record<SupportedSettlementChainId, Chain> = {
  1: mainnet,
  56: bsc,
  8453: base,
  196: xLayer,
  42161: arbitrum,
};

export function getSettlementViemChain(chainId: SupportedSettlementChainId): Chain {
  return SETTLEMENT_VIEM_CHAINS[chainId];
}

/** Public default RPC per settlement chain — overridable per chain via
 *  MorvaConfig.settlementRpcUrls. */
const DEFAULT_SETTLEMENT_RPC_URLS: Record<SupportedSettlementChainId, string> = {
  1: "https://eth.llamarpc.com",
  56: "https://bsc-dataseed.binance.org",
  8453: "https://mainnet.base.org",
  196: "https://rpc.xlayer.tech",
  42161: "https://arb1.arbitrum.io/rpc",
};

export function getDefaultSettlementRpcUrl(chainId: SupportedSettlementChainId): string {
  return DEFAULT_SETTLEMENT_RPC_URLS[chainId];
}

/** Canonical, natively-issued 1:1 USD-pegged stablecoins, keyed by
 *  settlement chain. Used only to gate pay()'s pre-flight balance check
 *  (see ua/pay.ts) — that check compares a USD balance against a raw
 *  settlementToken amount, which is only a valid comparison when one
 *  unit of the token is worth ~$1. Addresses verified against Circle's
 *  own contract-address reference and block explorers (Etherscan/
 *  Basescan/Arbiscan), not guessed. Deliberately excludes BNB Chain and
 *  X Layer: their most-used USDC/USDT deployments are third-party
 *  bridged tokens rather than a natively-verified canonical address, and
 *  guessing wrong here would be worse than skipping — a chain/token
 *  combination missing from this table simply skips the pre-flight
 *  shortcut (never a fund-safety issue, since settlementToken/
 *  settlementRecipient themselves are untouched by this table; a real
 *  shortfall still surfaces as a MorvaSdkError from the transfer attempt
 *  itself). Add BSC/X Layer entries once confirmed against an
 *  authoritative source. */
const USD_STABLECOINS_BY_CHAIN: Partial<Record<SupportedSettlementChainId, ReadonlySet<string>>> = {
  1: new Set([
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
    "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  ]),
  8453: new Set([
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC
  ]),
  42161: new Set([
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // USDC (native)
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc", // USDC.e (bridged)
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb", // USDT
    "0xda10009cbd5d07dd0cecc66161fc93d7c9000da", // DAI
  ]),
};

export function isUsdPeggedStablecoin(chainId: number, token: Address): boolean {
  const set = USD_STABLECOINS_BY_CHAIN[chainId as SupportedSettlementChainId];
  return set?.has(token.toLowerCase()) ?? false;
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
  /** RPC for reading MorvaRegistry itself — independent of settlement
   *  chain choice, since the registry contract always lives on one fixed
   *  chain (Arbitrum One) regardless of where any given merchant settles.
   *  Defaults to the public Arbitrum RPC. */
  registryRpcUrl?: string;
  /** Per-settlement-chain RPC overrides, used by pay()'s settlement-
   *  detection fallback (see ua/pay.ts). Chains not listed here fall back
   *  to a public default RPC — see getDefaultSettlementRpcUrl(). */
  settlementRpcUrls?: Partial<Record<SupportedSettlementChainId, string>>;
  /** Basis points, default 100 (1%). */
  slippageBps?: number;
  /** How long session.pay() polls for settlement before throwing
   *  SettlementTimeout. Default 120_000ms. */
  settlementTimeoutMs?: number;
}

export const DEFAULT_ARBITRUM_RPC_URL = DEFAULT_SETTLEMENT_RPC_URLS[42161];
export const DEFAULT_SLIPPAGE_BPS = 100;
export const DEFAULT_SETTLEMENT_TIMEOUT_MS = 120_000;
/** Deliberately an unsafe sentinel, not a real default — getAllMerchants()
 *  refuses to run (RegistryDeploymentBlockRequired) while
 *  registryDeploymentBlock is still this value, rather than silently
 *  scanning MerchantRegistered logs from genesis. */
export const DEFAULT_REGISTRY_DEPLOYMENT_BLOCK = 0n;
