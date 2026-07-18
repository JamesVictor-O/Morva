import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import type { MorvaConfig } from "../src/config";
import type { PaymentIntent } from "../src/intents";
import type { MorvaSigner } from "../src/ua/signer";

vi.mock("../src/ua/balance", () => ({ getUnifiedBalance: vi.fn() }));
vi.mock("../src/ua/pay", () => ({ pay: vi.fn() }));

const { getUnifiedBalance } = await import("../src/ua/balance");
const { pay } = await import("../src/ua/pay");
const { BuyerSession } = await import("../src/session");

const SIGNER_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

function mockSigner(): MorvaSigner {
  return { address: SIGNER_ADDRESS, signMessage: vi.fn(), signAuthorization: vi.fn() };
}

function mockConfig(overrides: Partial<MorvaConfig> = {}): MorvaConfig {
  return {
    particle: { projectId: "p", projectClientKey: "k", projectAppUuid: "u" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(getUnifiedBalance).mockReset();
  vi.mocked(pay).mockReset();
});

describe("BuyerSession", () => {
  it("exposes the signer's address", () => {
    const session = new BuyerSession({} as UniversalAccount, mockSigner(), mockConfig());
    expect(session.address).toBe(SIGNER_ADDRESS);
  });

  it("getUnifiedBalance delegates to ua/balance.getUnifiedBalance with the Universal Account", async () => {
    const ua = {} as UniversalAccount;
    const fakeBalance = {
      totalUsd: "10.00",
      assets: [],
      raw: { assets: [], totalAmountInUSD: 10 },
    } as Awaited<ReturnType<typeof getUnifiedBalance>>;
    vi.mocked(getUnifiedBalance).mockResolvedValue(fakeBalance);

    const session = new BuyerSession(ua, mockSigner(), mockConfig());
    const balance = await session.getUnifiedBalance();

    expect(getUnifiedBalance).toHaveBeenCalledWith(ua);
    expect(balance).toBe(fakeBalance);
  });

  it("pay delegates to ua/pay.pay with the config's settlementRpcUrls and settlementTimeoutMs", async () => {
    const ua = {} as UniversalAccount;
    const signer = mockSigner();
    const config = mockConfig({ settlementRpcUrls: { 42161: "https://custom-rpc" }, settlementTimeoutMs: 5_000 });
    const intent = { orderId: "o1" } as PaymentIntent;
    const onStatus = vi.fn();
    const fakeResult = { transactionId: "tx-1", explorerUrl: "https://example.com" };
    vi.mocked(pay).mockResolvedValue(fakeResult);

    const session = new BuyerSession(ua, signer, config);
    const result = await session.pay(intent, { onStatus });

    expect(pay).toHaveBeenCalledWith(ua, signer, intent, {
      onStatus,
      settlementRpcUrls: { 42161: "https://custom-rpc" },
      settlementTimeoutMs: 5_000,
    });
    expect(result).toBe(fakeResult);
  });

  it("forwards onDebug, resumeTransactionId, and buildExplorerUrl through to ua/pay.pay", async () => {
    const ua = {} as UniversalAccount;
    const signer = mockSigner();
    const config = mockConfig();
    const intent = { orderId: "o1" } as PaymentIntent;
    const onDebug = vi.fn();
    const buildExplorerUrl = (id: string) => `https://example.com/${id}`;
    const fakeResult = { transactionId: "tx-1", explorerUrl: "https://example.com/tx-1" };
    vi.mocked(pay).mockResolvedValue(fakeResult);

    const session = new BuyerSession(ua, signer, config);
    await session.pay(intent, { onDebug, resumeTransactionId: "tx-earlier", buildExplorerUrl });

    expect(pay).toHaveBeenCalledWith(
      ua,
      signer,
      intent,
      expect.objectContaining({ onDebug, resumeTransactionId: "tx-earlier", buildExplorerUrl })
    );
  });
});
