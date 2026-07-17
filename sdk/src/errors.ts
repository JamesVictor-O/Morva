/** Base class for every error this SDK throws. Catching this alone is
 *  enough to catch anything Morva-specific; unexpected/unmapped failures
 *  from the underlying SDKs get wrapped here directly with `cause` set. */
export class MorvaSdkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MorvaSdkError";
  }
}

export class MerchantNotFound extends MorvaSdkError {
  constructor(public readonly merchant: string) {
    super(`No merchant registered at ${merchant}`);
    this.name = "MerchantNotFound";
  }
}

export class MerchantInactive extends MorvaSdkError {
  constructor(public readonly merchant: string) {
    super(`Merchant ${merchant} is registered but not active`);
    this.name = "MerchantInactive";
  }
}

export class RegistryNotConfigured extends MorvaSdkError {
  constructor() {
    super(
      "No registryAddress configured in MorvaConfig — pass one, or use createDirectIntent() instead of createPaymentIntent()"
    );
    this.name = "RegistryNotConfigured";
  }
}

export class RegistryDeploymentBlockRequired extends MorvaSdkError {
  constructor() {
    super(
      "getAllMerchants() needs registryDeploymentBlock set in MorvaConfig — it defaults to block 0, " +
        "and scanning MerchantRegistered logs from genesis is rejected or throttled by most RPC " +
        "providers. Set it to the block MorvaRegistry was actually deployed at."
    );
    this.name = "RegistryDeploymentBlockRequired";
  }
}

/** Thrown by the pay() pre-flight check, which only runs when
 *  settlementToken is a recognized USD-pegged stablecoin (see
 *  isUsdPeggedStablecoin in config.ts) — for any other settlement token,
 *  an insufficient balance instead surfaces as a MorvaSdkError from the
 *  actual transfer attempt. */
export class InsufficientUnifiedBalance extends MorvaSdkError {
  constructor(
    public readonly requiredUsd: string,
    public readonly availableUsd: string
  ) {
    super(`Unified balance ($${availableUsd}) does not cover this payment ($${requiredUsd})`);
    this.name = "InsufficientUnifiedBalance";
  }
}

export class UserRejectedSignature extends MorvaSdkError {
  constructor(cause?: unknown) {
    super("Signature request was rejected", { cause });
    this.name = "UserRejectedSignature";
  }
}

export class SettlementTimeout extends MorvaSdkError {
  constructor(
    public readonly transactionId: string,
    public readonly timeoutMs: number
  ) {
    super(`Settlement for transaction ${transactionId} did not confirm within ${timeoutMs}ms`);
    this.name = "SettlementTimeout";
  }
}
