import { createPublicClient, http, type Address, type Hex, type WalletClient } from "viem";
import { arbitrum } from "viem/chains";
import { DEFAULT_ARBITRUM_RPC_URL, type MorvaConfig } from "./config";
import { MerchantInactive } from "./errors";
import { buildDirectIntent, buildPaymentIntentFromMerchant, type PaymentIntent } from "./intents";
import { RegistryClient, type MerchantConfig, type MerchantConfigInput } from "./registry/client";
import { createUniversalAccount } from "./ua/account";
import type { MorvaSigner } from "./ua/signer";
import { BuyerSession } from "./session";

export class Morva {
  private readonly registry: RegistryClient;

  constructor(private readonly config: MorvaConfig) {
    const publicClient = createPublicClient({
      chain: arbitrum,
      transport: http(config.rpcUrl ?? DEFAULT_ARBITRUM_RPC_URL),
    });
    this.registry = new RegistryClient(publicClient, config.registryAddress, config.registryDeploymentBlock);
  }

  async getMerchant(merchant: Address): Promise<MerchantConfig> {
    return this.registry.getMerchant(merchant);
  }

  async getAllMerchants(): Promise<Array<{ address: Address } & MerchantConfig>> {
    return this.registry.getAllMerchants();
  }

  async createPaymentIntent(args: {
    merchant: Address;
    amount: string;
    orderId: string;
  }): Promise<PaymentIntent> {
    const merchantConfig = await this.registry.getMerchant(args.merchant);
    if (!merchantConfig.active) throw new MerchantInactive(args.merchant);
    return buildPaymentIntentFromMerchant(args.merchant, merchantConfig, args.amount, args.orderId);
  }

  createDirectIntent(args: {
    amount: string;
    orderId: string;
    settlementToken: Address;
    settlementRecipient: Address;
  }): PaymentIntent {
    return buildDirectIntent(args);
  }

  async connect(signer: MorvaSigner): Promise<BuyerSession> {
    const ua = createUniversalAccount(this.config, signer.address);
    return new BuyerSession(ua, signer, this.config);
  }

  async registerMerchant(cfg: MerchantConfigInput, walletClient: WalletClient): Promise<Hex> {
    return this.registry.registerMerchant(cfg, walletClient);
  }

  async updateMerchant(cfg: MerchantConfigInput, walletClient: WalletClient): Promise<Hex> {
    return this.registry.updateMerchant(cfg, walletClient);
  }
}

export function createMorva(config: MorvaConfig): Morva {
  return new Morva(config);
}
