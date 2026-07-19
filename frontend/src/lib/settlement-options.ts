import type { SupportedSettlementChainId } from "@morva/sdk";

export interface SettlementOption {
  chainId: SupportedSettlementChainId;
  chainName: string;
  token: "USDC";
  tokenAddress: `0x${string}`;
}

/** Every settlement combination a merchant can actually pick in the
 *  settings UI. Deliberately a short, verified list, not "any token on
 *  any of the SDK's SUPPORTED_SETTLEMENT_CHAIN_IDS" — two real
 *  constraints narrow it:
 *
 *  1. Product prices are stored and entered in USD. Settling in a
 *     non-1:1-USD token (ETH, BNB, ...) would need a live price
 *     conversion this app has no oracle for — settling in anything but a
 *     verified USD stablecoin would silently charge the wrong amount.
 *  2. Addresses here are verified against an authoritative source
 *     (Circle's own contract-address reference, cross-checked against
 *     Etherscan/Basescan/Arbiscan) — the same bar sdk/src/config.ts's
 *     isUsdPeggedStablecoin list holds itself to. BNB Chain and X Layer
 *     are excluded until their canonical USDC address is confirmed the
 *     same way, not guessed. */
export const SETTLEMENT_OPTIONS: SettlementOption[] = [
  {
    chainId: 42161,
    chainName: "Arbitrum One",
    token: "USDC",
    tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  {
    chainId: 8453,
    chainName: "Base",
    token: "USDC",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  {
    chainId: 1,
    chainName: "Ethereum",
    token: "USDC",
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
];

export const DEFAULT_SETTLEMENT_OPTION = SETTLEMENT_OPTIONS[0];

export function findSettlementOption(chainId: number, token: string): SettlementOption | undefined {
  return SETTLEMENT_OPTIONS.find((option) => option.chainId === chainId && option.token === token);
}

export function settlementOptionKey(option: { chainId: number; token: string }): string {
  return `${option.chainId}:${option.token}`;
}
