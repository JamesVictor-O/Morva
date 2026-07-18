import type { Address } from "viem";
import { DEFAULT_SETTLEMENT_CHAIN_ID, isSupportedSettlementChainId, type SupportedSettlementChainId } from "./config";
import { UnsupportedSettlementChain } from "./errors";
import type { MerchantConfig } from "./registry/client";

export interface PaymentIntent {
  merchant?: Address;
  orderId: string;
  /** Human-readable settlement-token units, e.g. "4.99". */
  amount: string;
  settlementToken: Address;
  settlementRecipient: Address;
  settlementChainId: SupportedSettlementChainId;
}

function resolveSettlementChainId(chainId: number | undefined): SupportedSettlementChainId {
  if (chainId === undefined) return DEFAULT_SETTLEMENT_CHAIN_ID;
  if (!isSupportedSettlementChainId(chainId)) throw new UnsupportedSettlementChain(chainId);
  return chainId;
}

export function buildPaymentIntentFromMerchant(
  merchant: Address,
  config: MerchantConfig,
  amount: string,
  orderId: string
): PaymentIntent {
  return {
    merchant,
    orderId,
    amount,
    settlementToken: config.settlementToken,
    settlementRecipient: config.settlementRecipient,
    settlementChainId: resolveSettlementChainId(config.settlementChainId),
  };
}

export function buildDirectIntent(args: {
  amount: string;
  orderId: string;
  settlementToken: Address;
  settlementRecipient: Address;
  /** Which chain settlementToken/settlementRecipient live on. Defaults to
   *  DEFAULT_SETTLEMENT_CHAIN_ID (Arbitrum One) — pass one of
   *  SUPPORTED_SETTLEMENT_CHAIN_IDS to settle elsewhere. */
  settlementChainId?: SupportedSettlementChainId;
}): PaymentIntent {
  return {
    orderId: args.orderId,
    amount: args.amount,
    settlementToken: args.settlementToken,
    settlementRecipient: args.settlementRecipient,
    settlementChainId: resolveSettlementChainId(args.settlementChainId),
  };
}
