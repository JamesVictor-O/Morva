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

/** Thrown when a settlementChainId (from createDirectIntent's caller, or
 *  read back from a merchant's on-chain registry config) isn't one of
 *  SUPPORTED_SETTLEMENT_CHAIN_IDS (config.ts). Particle's own SDK would
 *  eventually reject an unsupported chain too, but this fails fast with a
 *  clear, typed reason instead of a generic error from deep inside
 *  createTransferTransaction(). */
export class UnsupportedSettlementChain extends MorvaSdkError {
  constructor(public readonly chainId: number) {
    super(`Chain ${chainId} isn't a supported settlement chain — see SUPPORTED_SETTLEMENT_CHAIN_IDS`);
    this.name = "UnsupportedSettlementChain";
  }
}

/** Thrown by the pay() pre-flight check, which only runs when
 *  settlementToken is a recognized USD-pegged stablecoin (see
 *  isUsdPeggedStablecoin in config.ts) — for any other settlement token,
 *  or when this check passes but the transfer is still unroutable,
 *  see UnroutableBalance instead. */
export class InsufficientUnifiedBalance extends MorvaSdkError {
  constructor(
    public readonly requiredUsd: string,
    public readonly availableUsd: string
  ) {
    super(`Unified balance ($${availableUsd}) does not cover this payment ($${requiredUsd})`);
    this.name = "InsufficientUnifiedBalance";
  }
}

/** Thrown when Particle's own routing engine rejects a transfer as
 *  unroutable — confirmed via live testing against real wallets: code
 *  -32653, message "Insufficient primary token balance" — even though
 *  the buyer's aggregate unified balance (what InsufficientUnifiedBalance
 *  checks) looked sufficient. Particle doesn't publish the reserve/fee
 *  logic behind this, so unlike InsufficientUnifiedBalance there's no
 *  structured required-vs-available figure to offer — just the fact that
 *  this specific amount, from this specific balance shape, couldn't be
 *  routed. Same underlying meaning to a caller ("buyer can't cover this
 *  right now"), so both are worth catching together via MorvaSdkError if
 *  you don't need to distinguish them. */
export class UnroutableBalance extends MorvaSdkError {
  constructor(
    public readonly amount: string,
    cause?: unknown
  ) {
    super(
      `Buyer's balance can't be routed to cover ${amount} of the settlement token — rejected as insufficient by the Universal Account's own routing, even though the aggregate unified balance appeared to cover it`,
      { cause }
    );
    this.name = "UnroutableBalance";
  }
}

/** Only ever thrown for an actual EIP-1193-style rejection (error code
 *  4001, or a message matching "user rejected"/"user denied") — any other
 *  failure from signAuthorization/signMessage (a network error, a signer
 *  bug, a malformed request) surfaces as MorvaSdkError instead, so a
 *  checkout UI doesn't tell a buyer "you cancelled" when the real cause
 *  was an infra failure. */
export class UserRejectedSignature extends MorvaSdkError {
  constructor(cause?: unknown) {
    super("Signature request was rejected", { cause });
    this.name = "UserRejectedSignature";
  }
}

/** Thrown when pay() can't confirm settlement within settlementTimeoutMs
 *  — this is NOT the same as a confirmed on-chain failure (that surfaces
 *  as a plain MorvaSdkError with "settled as failed/refunded" in its
 *  message instead). A SettlementTimeout means genuinely unknown: the
 *  payment may still land after this throws, especially on a congested
 *  cross-chain route. pay()'s onStatus callback reports this case as
 *  "unknown", never "failed" — treat it as "needs reconciliation," and
 *  pass this error's transactionId back in as PayOptions.resumeTransactionId
 *  on retry rather than calling pay() from scratch, or a buyer already
 *  charged once can be charged again. */
export class SettlementTimeout extends MorvaSdkError {
  constructor(
    public readonly transactionId: string,
    public readonly timeoutMs: number
  ) {
    super(`Settlement for transaction ${transactionId} did not confirm within ${timeoutMs}ms`);
    this.name = "SettlementTimeout";
  }
}
