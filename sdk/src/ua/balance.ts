import type { IAssetsResponse, UniversalAccount } from "@particle-network/universal-account-sdk";
import { MorvaSdkError } from "../errors";

export interface UnifiedBalanceChain {
  chainId: number;
  amount: string;
}

export interface UnifiedBalanceAsset {
  symbol: string;
  totalAmount: string;
  usdValue: string;
  chains: UnifiedBalanceChain[];
}

export interface UnifiedBalance {
  totalUsd: string;
  assets: UnifiedBalanceAsset[];
  /** The untransformed getPrimaryAssets() response, for callers that need
   *  fields this mapping doesn't expose. */
  raw: IAssetsResponse;
}

export async function getUnifiedBalance(ua: UniversalAccount): Promise<UnifiedBalance> {
  let raw: IAssetsResponse;
  try {
    raw = await ua.getPrimaryAssets();
  } catch (err) {
    throw new MorvaSdkError("Failed to fetch unified balance", { cause: err });
  }

  return {
    totalUsd: raw.totalAmountInUSD.toFixed(2),
    assets: raw.assets.map((asset) => ({
      symbol: asset.tokenType.toUpperCase(),
      totalAmount: String(asset.amount),
      usdValue: asset.amountInUSD.toFixed(2),
      chains: asset.chainAggregation.map((agg) => ({
        chainId: agg.token.chainId,
        amount: String(agg.amount),
      })),
    })),
    raw,
  };
}
