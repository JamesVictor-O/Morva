import { describe, expect, it } from "vitest";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { getUnifiedBalance } from "../src/ua/balance";
import { MorvaSdkError } from "../src/errors";
import fixture from "./fixtures/primary-assets-response.json";

function mockUa(getPrimaryAssets: UniversalAccount["getPrimaryAssets"]): UniversalAccount {
  return { getPrimaryAssets } as unknown as UniversalAccount;
}

describe("getUnifiedBalance", () => {
  it("maps getPrimaryAssets() into the UnifiedBalance shape", async () => {
    const ua = mockUa(async () => fixture as Awaited<ReturnType<UniversalAccount["getPrimaryAssets"]>>);

    const balance = await getUnifiedBalance(ua);

    expect(balance.totalUsd).toBe("42.77");
    expect(balance.raw).toBe(fixture);

    const usdc = balance.assets.find((a) => a.symbol === "USDC");
    expect(usdc).toBeDefined();
    expect(usdc?.usdValue).toBe("40.50");
    expect(usdc?.chains).toEqual([
      { chainId: 8453, amount: "25" },
      { chainId: 42161, amount: "15.5" },
    ]);

    expect(balance.assets.map((a) => a.symbol)).toEqual(["USDC", "ETH", "SOL"]);
  });

  it("wraps a failing getPrimaryAssets() call in MorvaSdkError", async () => {
    const ua = mockUa(async () => {
      throw new Error("network down");
    });

    await expect(getUnifiedBalance(ua)).rejects.toBeInstanceOf(MorvaSdkError);
  });
});
