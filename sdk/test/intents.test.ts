import { describe, expect, it } from "vitest";
import { buildDirectIntent, buildPaymentIntentFromMerchant } from "../src/intents";
import type { MerchantConfig } from "../src/registry/client";

const MERCHANT = "0x1111111111111111111111111111111111111111" as const;
const TOKEN = "0x2222222222222222222222222222222222222222" as const;
const RECIPIENT = "0x3333333333333333333333333333333333333333" as const;

describe("buildPaymentIntentFromMerchant", () => {
  it("resolves settlement fields from the merchant config", () => {
    const config: MerchantConfig = {
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      metadataURI: "https://example.com/metadata.json",
      active: true,
    };

    const intent = buildPaymentIntentFromMerchant(MERCHANT, config, "4.99", "order-1");

    expect(intent).toEqual({
      merchant: MERCHANT,
      orderId: "order-1",
      amount: "4.99",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      settlementChainId: 42161,
    });
  });
});

describe("buildDirectIntent", () => {
  it("builds an intent with no merchant/registry lookup", () => {
    const intent = buildDirectIntent({
      amount: "1.00",
      orderId: "order-2",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
    });

    expect(intent.merchant).toBeUndefined();
    expect(intent).toEqual({
      orderId: "order-2",
      amount: "1.00",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      settlementChainId: 42161,
    });
  });
});
