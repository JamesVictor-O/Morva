// Deliberately hardcoded rather than importing CHAIN_ID from
// @particle-network/universal-account-sdk: that package's module isn't
// safe to evaluate during SSR (see particle-balance.ts), and this file is
// pulled into the server bundle transitively through AuthContext. These
// numbers are CHAIN_ID's actual values in universal-account-sdk@2.0.3 —
// pinned, same version as sdk/src/ua/account.ts. Keep in sync if that
// enum ever grows.
const CHAIN_ID = {
  ETHEREUM_MAINNET: 1,
  BSC_MAINNET: 56,
  BASE_MAINNET: 8453,
  XLAYER_MAINNET: 196,
  ARBITRUM_MAINNET_ONE: 42161,
  SOLANA_MAINNET: 101,
} as const;

/** Display metadata for every chain Particle's Universal Account SDK
 *  aggregates balance across. */
export const CHAIN_META: Record<number, { name: string; initial: string }> = {
  [CHAIN_ID.ETHEREUM_MAINNET]: { name: "Ethereum", initial: "E" },
  [CHAIN_ID.ARBITRUM_MAINNET_ONE]: { name: "Arbitrum", initial: "A" },
  [CHAIN_ID.BASE_MAINNET]: { name: "Base", initial: "B" },
  [CHAIN_ID.BSC_MAINNET]: { name: "BNB Chain", initial: "N" },
  [CHAIN_ID.XLAYER_MAINNET]: { name: "X Layer", initial: "X" },
  [CHAIN_ID.SOLANA_MAINNET]: { name: "Solana", initial: "S" },
};

export function chainMeta(chainId: number): { name: string; initial: string } {
  return CHAIN_META[chainId] ?? { name: `Chain ${chainId}`, initial: "?" };
}
