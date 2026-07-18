import { describe, expect, it } from "vitest";
import {
  InsufficientUnifiedBalance,
  MerchantInactive,
  MerchantNotFound,
  MorvaSdkError,
  RegistryNotConfigured,
  SettlementTimeout,
  UnroutableBalance,
  UnsupportedSettlementChain,
  UserRejectedSignature,
} from "../src/errors";

describe("error classes", () => {
  it("all extend MorvaSdkError so a single catch can handle any of them", () => {
    const errors = [
      new MerchantNotFound("0xabc"),
      new MerchantInactive("0xabc"),
      new RegistryNotConfigured(),
      new InsufficientUnifiedBalance("10.00", "4.50"),
      new UnroutableBalance("10.00"),
      new UserRejectedSignature(),
      new SettlementTimeout("tx-1", 120_000),
      new UnsupportedSettlementChain(999),
    ];

    for (const err of errors) {
      expect(err).toBeInstanceOf(MorvaSdkError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe(err.constructor.name);
    }
  });

  it("MorvaSdkError wraps an unknown cause", () => {
    const cause = new Error("boom");
    const wrapped = new MorvaSdkError("Something failed", { cause });
    expect(wrapped.cause).toBe(cause);
  });

  it("carries structured fields for programmatic handling", () => {
    const insufficient = new InsufficientUnifiedBalance("10.00", "4.50");
    expect(insufficient.requiredUsd).toBe("10.00");
    expect(insufficient.availableUsd).toBe("4.50");

    const timeout = new SettlementTimeout("tx-1", 120_000);
    expect(timeout.transactionId).toBe("tx-1");
    expect(timeout.timeoutMs).toBe(120_000);

    const unsupported = new UnsupportedSettlementChain(999);
    expect(unsupported.chainId).toBe(999);

    const unroutable = new UnroutableBalance("10.00");
    expect(unroutable.amount).toBe("10.00");
  });
});
