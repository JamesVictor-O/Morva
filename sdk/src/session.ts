import type { Address } from "viem";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import type { MorvaConfig } from "./config";
import type { PaymentIntent } from "./intents";
import { getUnifiedBalance, type UnifiedBalance } from "./ua/balance";
import { pay, type PaymentResult, type PaymentStatus } from "./ua/pay";
import type { MorvaSigner } from "./ua/signer";

/** A connected buyer — a Particle Universal Account (EIP-7702 mode)
 *  paired with the signer that authorizes its transactions. */
export class BuyerSession {
  constructor(
    private readonly ua: UniversalAccount,
    private readonly signer: MorvaSigner,
    private readonly config: MorvaConfig
  ) {}

  get address(): Address {
    return this.signer.address;
  }

  async getUnifiedBalance(): Promise<UnifiedBalance> {
    return getUnifiedBalance(this.ua);
  }

  async pay(
    intent: PaymentIntent,
    opts?: { onStatus?: (status: PaymentStatus) => void }
  ): Promise<PaymentResult> {
    return pay(this.ua, this.signer, intent, {
      onStatus: opts?.onStatus,
      rpcUrl: this.config.rpcUrl,
    });
  }
}
