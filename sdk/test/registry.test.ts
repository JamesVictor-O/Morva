import { describe, expect, it, vi } from "vitest";
import type { PublicClient } from "viem";
import { RegistryClient } from "../src/registry/client";
import { MerchantNotFound, RegistryDeploymentBlockRequired, RegistryNotConfigured } from "../src/errors";

const REGISTRY = "0x9999999999999999999999999999999999999999" as const;
const ZERO = "0x0000000000000000000000000000000000000000" as const;
const MERCHANT_A = "0x1111111111111111111111111111111111111111" as const;
const MERCHANT_B = "0x2222222222222222222222222222222222222222" as const;
const TOKEN = "0x3333333333333333333333333333333333333333" as const;
const RECIPIENT = "0x4444444444444444444444444444444444444444" as const;

function mockPublicClient(overrides: Partial<PublicClient> = {}): PublicClient {
  return {
    readContract: vi.fn(),
    getLogs: vi.fn(),
    ...overrides,
  } as unknown as PublicClient;
}

describe("RegistryClient", () => {
  it("throws RegistryNotConfigured when no address is set", async () => {
    const client = new RegistryClient(mockPublicClient(), undefined);
    await expect(client.getMerchant(MERCHANT_A)).rejects.toBeInstanceOf(RegistryNotConfigured);
  });

  it("throws MerchantNotFound for a zero-valued (unregistered) config", async () => {
    const publicClient = mockPublicClient({
      readContract: vi.fn().mockResolvedValue({
        settlementToken: ZERO,
        settlementRecipient: ZERO,
        metadataURI: "",
        active: false,
      }),
    });
    const client = new RegistryClient(publicClient, REGISTRY);

    await expect(client.getMerchant(MERCHANT_A)).rejects.toBeInstanceOf(MerchantNotFound);
  });

  it("returns a registered merchant's config", async () => {
    const publicClient = mockPublicClient({
      readContract: vi.fn().mockResolvedValue({
        settlementToken: TOKEN,
        settlementRecipient: RECIPIENT,
        metadataURI: "",
        active: true,
        settlementChainId: 42161,
      }),
    });
    const client = new RegistryClient(publicClient, REGISTRY);

    const config = await client.getMerchant(MERCHANT_A);
    expect(config).toEqual({
      settlementToken: TOKEN,
      settlementRecipient: RECIPIENT,
      metadataURI: "",
      active: true,
      settlementChainId: 42161,
      metadata: undefined,
    });
  });

  it("getAllMerchants lists registered merchants and filters out inactive ones", async () => {
    const readContract = vi.fn(async (params: { args: readonly [string] }) => {
      const [merchant] = params.args;
      if (merchant === MERCHANT_A) {
        return {
          settlementToken: TOKEN,
          settlementRecipient: RECIPIENT,
          metadataURI: "",
          active: true,
          settlementChainId: 42161,
        };
      }
      return {
        settlementToken: TOKEN,
        settlementRecipient: RECIPIENT,
        metadataURI: "",
        active: false,
        settlementChainId: 42161,
      };
    }) as unknown as PublicClient["readContract"];
    const getLogs = vi.fn().mockResolvedValue([
      { args: { merchant: MERCHANT_A } },
      { args: { merchant: MERCHANT_B } },
    ]);
    const publicClient = mockPublicClient({ readContract, getLogs });
    const client = new RegistryClient(publicClient, REGISTRY, 100n);

    const merchants = await client.getAllMerchants();
    expect(merchants).toHaveLength(1);
    expect(merchants[0].address).toBe(MERCHANT_A);
  });

  it("getAllMerchants refuses to scan from genesis when deploymentBlock is left at its unsafe default", async () => {
    const getLogs = vi.fn();
    const publicClient = mockPublicClient({ getLogs });
    const client = new RegistryClient(publicClient, REGISTRY); // no deploymentBlock passed — defaults to 0n

    await expect(client.getAllMerchants()).rejects.toBeInstanceOf(RegistryDeploymentBlockRequired);
    expect(getLogs).not.toHaveBeenCalled();
  });
});
