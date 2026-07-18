import { describe, expect, it } from "vitest";
import { buildDirectIntent, buildPaymentIntentFromMerchant } from "../src/intents";
import { UnsupportedSettlementChain } from "../src/errors";
import type { MerchantConfig } from "../src/registry/client";

const MERCHANT = "0x1111111111111111111111111111111111111111" as const;
const TOKEN = "0x2222222222222222222222222222222222222222" as const;
const RECIPIENT = "0x3333333333333333333333333333333333333333" as const;

describe("buildPaymentIntentFromMerchant", () => {
  it("resolves settlement fields, including chain, from the merchant config", () => {
    const config: MerchantConfig = {
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      metadataURI: "https://example.com/metadata.json",
      active: true,
      settlementChainId: 8453,
    };

    const intent = buildPaymentIntentFromMerchant(MERCHANT, config, "4.99", "order-1");

    expect(intent).toEqual({
      merchant: MERCHANT,
      orderId: "order-1",
      amount: "4.99",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      settlementChainId: 8453,
    });
  });

  it("throws UnsupportedSettlementChain when the registry config carries an unrecognized chain id", () => {
    const config: MerchantConfig = {
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      metadataURI: "",
      active: true,
      settlementChainId: 999,
    };

    expect(() => buildPaymentIntentFromMerchant(MERCHANT, config, "4.99", "order-1")).toThrow(
      UnsupportedSettlementChain
    );
  });
});

describe("buildDirectIntent", () => {
  it("defaults to Arbitrum One when settlementChainId is omitted", () => {
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

  it("honors an explicit supported settlementChainId", () => {
    const intent = buildDirectIntent({
      amount: "1.00",
      orderId: "order-3",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      settlementChainId: 56,
    });

    expect(intent.settlementChainId).toBe(56);
  });

  it("throws UnsupportedSettlementChain for a chain outside the supported set", () => {
    expect(() =>
      buildDirectIntent({
        amount: "1.00",
        orderId: "order-4",
        settlementToken: TOKEN,
        settlementRecipient: RECIPIENT,
        // @ts-expect-error deliberately invalid at the type level too
        settlementChainId: 137,
      })
    ).toThrow(UnsupportedSettlementChain);
  });
});
