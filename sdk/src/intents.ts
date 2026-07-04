import type { Address } from "viem";
import { ARBITRUM_ONE_CHAIN_ID } from "./config";
import type { MerchantConfig } from "./registry/client";

export interface PaymentIntent {
  merchant?: Address;
  orderId: string;
  /** Human-readable settlement-token units, e.g. "4.99". */
  amount: string;
  settlementToken: Address;
  settlementRecipient: Address;
  settlementChainId: typeof ARBITRUM_ONE_CHAIN_ID;
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
    settlementChainId: ARBITRUM_ONE_CHAIN_ID,
  };
}

export function buildDirectIntent(args: {
  amount: string;
  orderId: string;
  settlementToken: Address;
  settlementRecipient: Address;
}): PaymentIntent {
  return {
    orderId: args.orderId,
    amount: args.amount,
    settlementToken: args.settlementToken,
    settlementRecipient: args.settlementRecipient,
    settlementChainId: ARBITRUM_ONE_CHAIN_ID,
  };
}
