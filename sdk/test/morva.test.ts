import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WalletClient } from "viem";
import type { MorvaConfig } from "../src/config";
import type { MorvaSigner } from "../src/ua/signer";

const { readContract, getLogs, createPublicClientMock } = vi.hoisted(() => {
  const readContract = vi.fn();
  const getLogs = vi.fn();
  return { readContract, getLogs, createPublicClientMock: vi.fn(() => ({ readContract, getLogs })) };
});

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return { ...actual, createPublicClient: createPublicClientMock };
});

const createUniversalAccountMock = vi.hoisted(() => vi.fn());
vi.mock("../src/ua/account", () => ({ createUniversalAccount: createUniversalAccountMock }));

const { Morva, createMorva } = await import("../src/morva");
const { BuyerSession } = await import("../src/session");
const { MerchantInactive } = await import("../src/errors");

const REGISTRY = "0x9999999999999999999999999999999999999999" as const;
const MERCHANT = "0x1111111111111111111111111111111111111111" as const;
const TOKEN = "0x3333333333333333333333333333333333333333" as const;
const RECIPIENT = "0x4444444444444444444444444444444444444444" as const;

function baseConfig(overrides: Partial<MorvaConfig> = {}): MorvaConfig {
  return {
    particle: { projectId: "p", projectClientKey: "k", projectAppUuid: "u" },
    registryAddress: REGISTRY,
    ...overrides,
  };
}

beforeEach(() => {
  readContract.mockReset();
  getLogs.mockReset();
  createPublicClientMock.mockClear();
  createUniversalAccountMock.mockReset();
});

describe("Morva", () => {
  it("createDirectIntent builds a PaymentIntent without touching the registry", () => {
    const morva = createMorva(baseConfig());

    const intent = morva.createDirectIntent({
      amount: "5.00",
      orderId: "o1",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
    });

    expect(intent).toEqual({
      orderId: "o1",
      amount: "5.00",
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      settlementChainId: 42161,
    });
    expect(readContract).not.toHaveBeenCalled();
  });

  it("createPaymentIntent throws MerchantInactive for a deactivated registered merchant", async () => {
    readContract.mockResolvedValue({
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      metadataURI: "",
      active: false,
      settlementChainId: 42161,
    });
    const morva = new Morva(baseConfig());

    await expect(
      morva.createPaymentIntent({ merchant: MERCHANT, amount: "5.00", orderId: "o1" })
    ).rejects.toBeInstanceOf(MerchantInactive);
  });

  it("createPaymentIntent builds an intent from an active merchant's registry config", async () => {
    readContract.mockResolvedValue({
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      metadataURI: "",
      active: true,
      settlementChainId: 42161,
    });
    const morva = new Morva(baseConfig());

    const intent = await morva.createPaymentIntent({ merchant: MERCHANT, amount: "5.00", orderId: "o1" });

    expect(intent).toMatchObject({
      merchant: MERCHANT,
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      settlementChainId: 42161,
    });
  });

  it("connect builds a BuyerSession around the signer's Universal Account", async () => {
    const fakeUa = { marker: "ua" };
    createUniversalAccountMock.mockReturnValue(fakeUa);
    const config = baseConfig();
    const morva = new Morva(config);
    const signer: MorvaSigner = {
      address: "0x0000000000000000000000000000000000000001",
      signMessage: vi.fn(),
      signAuthorization: vi.fn(),
    };

    const session = await morva.connect(signer);

    expect(createUniversalAccountMock).toHaveBeenCalledWith(config, signer.address);
    expect(session).toBeInstanceOf(BuyerSession);
    expect(session.address).toBe(signer.address);
  });

  it("registerMerchant delegates to the registry client with the configured registry address", async () => {
    const writeContract = vi.fn().mockResolvedValue("0xtxhash");
    const walletClient = { writeContract, chain: undefined, account: { address: "0x1" } } as unknown as WalletClient;
    const morva = new Morva(baseConfig());

    const hash = await morva.registerMerchant(
      { settlementToken: TOKEN, settlementRecipient: RECIPIENT, metadataURI: "", active: true, settlementChainId: 42161 },
      walletClient
    );

    expect(hash).toBe("0xtxhash");
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({ address: REGISTRY, functionName: "registerMerchant" })
    );
  });
});
