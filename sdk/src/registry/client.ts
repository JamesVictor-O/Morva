import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  getAbiItem,
  zeroAddress,
} from "viem";
import { MORVA_REGISTRY_ABI } from "./abi";
import { fetchMerchantMetadata, type MerchantMetadata } from "./metadata";
import { MerchantNotFound, MorvaSdkError, RegistryNotConfigured } from "../errors";
import { DEFAULT_REGISTRY_DEPLOYMENT_BLOCK } from "../config";

export interface MerchantConfig {
  settlementToken: Address;
  settlementRecipient: Address;
  metadataURI: string;
  active: boolean;
  metadata?: MerchantMetadata;
}

export type MerchantConfigInput = Omit<MerchantConfig, "metadata">;

export class RegistryClient {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly address?: Address,
    private readonly deploymentBlock: bigint = DEFAULT_REGISTRY_DEPLOYMENT_BLOCK
  ) {}

  private requireAddress(): Address {
    if (!this.address) throw new RegistryNotConfigured();
    return this.address;
  }

  async getMerchant(merchant: Address): Promise<MerchantConfig> {
    const registryAddress = this.requireAddress();

    let raw: { settlementToken: Address; settlementRecipient: Address; metadataURI: string; active: boolean };
    try {
      raw = (await this.publicClient.readContract({
        address: registryAddress,
        abi: MORVA_REGISTRY_ABI,
        functionName: "getMerchant",
        args: [merchant],
      })) as typeof raw;
    } catch (err) {
      throw new MorvaSdkError("Failed to read merchant config from registry", { cause: err });
    }

    // The registry's getMerchant() returns a zero-valued struct for an
    // unset mapping key rather than reverting — a non-zero
    // settlementRecipient is what distinguishes a real registration.
    if (raw.settlementRecipient === zeroAddress) {
      throw new MerchantNotFound(merchant);
    }

    const metadata = await fetchMerchantMetadata(raw.metadataURI);
    return { ...raw, metadata };
  }

  async getAllMerchants(): Promise<Array<{ address: Address } & MerchantConfig>> {
    const registryAddress = this.requireAddress();

    let logs;
    try {
      logs = await this.publicClient.getLogs({
        address: registryAddress,
        event: getAbiItem({ abi: MORVA_REGISTRY_ABI, name: "MerchantRegistered" }),
        fromBlock: this.deploymentBlock,
        toBlock: "latest",
      });
    } catch (err) {
      throw new MorvaSdkError("Failed to read merchant registrations from registry", { cause: err });
    }

    const merchantAddresses = [...new Set(logs.map((log) => (log.args as { merchant: Address }).merchant))];

    const merchants: Array<{ address: Address } & MerchantConfig> = [];
    for (const address of merchantAddresses) {
      const config = await this.getMerchant(address);
      if (config.active) merchants.push({ address, ...config });
    }
    return merchants;
  }

  async registerMerchant(cfg: MerchantConfigInput, walletClient: WalletClient): Promise<Hex> {
    const registryAddress = this.requireAddress();
    try {
      return await walletClient.writeContract({
        address: registryAddress,
        abi: MORVA_REGISTRY_ABI,
        functionName: "registerMerchant",
        args: [cfg],
        chain: walletClient.chain,
        account: walletClient.account!,
      });
    } catch (err) {
      throw new MorvaSdkError("Failed to register merchant", { cause: err });
    }
  }

  async updateMerchant(cfg: MerchantConfigInput, walletClient: WalletClient): Promise<Hex> {
    const registryAddress = this.requireAddress();
    try {
      return await walletClient.writeContract({
        address: registryAddress,
        abi: MORVA_REGISTRY_ABI,
        functionName: "updateMerchant",
        args: [cfg],
        chain: walletClient.chain,
        account: walletClient.account!,
      });
    } catch (err) {
      throw new MorvaSdkError("Failed to update merchant", { cause: err });
    }
  }
}
