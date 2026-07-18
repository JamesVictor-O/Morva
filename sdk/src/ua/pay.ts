import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  hexToBytes,
  http,
  parseUnits,
  toHex,
  zeroAddress,
  type Hex,
  type PublicClient,
} from "viem";
import { getSupportedToken, UA_TRANSACTION_STATUS, type UniversalAccount } from "@particle-network/universal-account-sdk";
import {
  DEFAULT_SETTLEMENT_TIMEOUT_MS,
  getDefaultSettlementRpcUrl,
  getSettlementViemChain,
  isUsdPeggedStablecoin,
  type SupportedSettlementChainId,
} from "../config";
import {
  InsufficientUnifiedBalance,
  MorvaSdkError,
  SettlementTimeout,
  UnroutableBalance,
  UserRejectedSignature,
} from "../errors";
import type { PaymentIntent } from "../intents";
import { signPendingAuthorizations } from "./authorization";
import type { MorvaSigner } from "./signer";
import { getUnifiedBalance } from "./balance";

export type PaymentStatus =
  | "building"
  | "authorizing"
  | "signing"
  | "submitted"
  | "settled"
  /** Settlement couldn't be confirmed within settlementTimeoutMs — NOT
   *  the same as "failed". The payment may still land; treat this as
   *  "needs reconciliation" (see SettlementTimeout) rather than a
   *  definite loss, and never auto-retry pay() from scratch on it. */
  | "unknown"
  | "failed";

export interface PaymentResult {
  transactionId: string;
  explorerUrl: string;
}

export interface PayOptions {
  onStatus?: (status: PaymentStatus) => void;
  /** Fires at internal settlement-detection decision points (which
   *  signal actually resolved a payment, why a step degraded to a
   *  fallback, or that the deadline was hit) — never required for
   *  correctness, but this is what you want wired up when running the
   *  e2e gate or debugging a specific payment. */
  onDebug?: (event: string, detail?: Record<string, unknown>) => void;
  /** Default 120_000ms. */
  settlementTimeoutMs?: number;
  /** Per-settlement-chain RPC overrides — see MorvaConfig.settlementRpcUrls. */
  settlementRpcUrls?: Partial<Record<SupportedSettlementChainId, string>>;
  /** Already have a transactionId from a previous pay() call against
   *  this exact intent — e.g. it threw with an "unknown" status after a
   *  SettlementTimeout, and you stored the transactionId against the
   *  order? Pass it here to resume polling that existing transaction
   *  instead of building, signing, and submitting a brand new transfer.
   *  This is the guard against double-charging a buyer on retry — pay()
   *  has no persistent memory of its own between calls, so this is the
   *  caller's half of that contract. */
  resumeTransactionId?: string;
  /** Builds the receipt URL from a transactionId. Defaults to
   *  universalx.app's activity page — override if you don't want your
   *  integration's receipts depending on a third-party app's URL scheme. */
  buildExplorerUrl?: (transactionId: string) => string;
}

const POLL_INTERVAL_MS = 3_000;

const FAILED_STATUS_CODES: number[] = [
  UA_TRANSACTION_STATUS.EXECUTION_FAILED,
  UA_TRANSACTION_STATUS.REFUND_FAILED,
  UA_TRANSACTION_STATUS.REFUND_FINISHED,
  UA_TRANSACTION_STATUS.PENNY_FAILED,
];

function defaultExplorerUrl(transactionId: string): string {
  return `https://universalx.app/activity/details?id=${transactionId}`;
}

export async function pay(
  ua: UniversalAccount,
  signer: MorvaSigner,
  intent: PaymentIntent,
  opts: PayOptions = {}
): Promise<PaymentResult> {
  const onStatus = opts.onStatus ?? (() => {});
  const onDebug = opts.onDebug ?? (() => {});
  const buildExplorerUrl = opts.buildExplorerUrl ?? defaultExplorerUrl;

  // Resuming a previous attempt: skip straight to settlement detection
  // instead of building/signing/submitting a brand new transfer. See
  // PayOptions.resumeTransactionId — this is the retry-safety contract.
  if (opts.resumeTransactionId) {
    const transactionId = opts.resumeTransactionId;
    onStatus("submitted");
    await finalizeSettlement(ua, transactionId, intent, opts, onStatus, onDebug);
    return { transactionId, explorerUrl: buildExplorerUrl(transactionId) };
  }

  onStatus("building");

  // Only a meaningful comparison when the settlement token is itself a
  // ~1:1 USD stablecoin — intent.amount is in settlementToken units, not
  // USD. For any other token (ETH, WETH, an NFT-collection token, ...)
  // this is skipped; an actually-insufficient balance still surfaces
  // below, from the real transfer attempt, as UnroutableBalance.
  const balance = await getUnifiedBalance(ua);
  if (
    isUsdPeggedStablecoin(intent.settlementChainId, intent.settlementToken) &&
    Number(balance.totalUsd) < Number(intent.amount)
  ) {
    onStatus("failed");
    throw new InsufficientUnifiedBalance(intent.amount, balance.totalUsd);
  }

  let transaction: Awaited<ReturnType<UniversalAccount["createTransferTransaction"]>>;
  try {
    transaction = await buildTransferTransaction(ua, intent);
  } catch (err) {
    onStatus("failed");
    // Particle's own routing engine rejects some transfers as
    // unroutable (code -32653, confirmed via live testing against real
    // wallets) even when the unified-balance pre-check above considered
    // them sufficient — it doesn't know Particle's own fee/reserve
    // requirements. Map it to a distinct, semantic error rather than the
    // generic wrapper below, so integrators have one error type for
    // "buyer can't cover this," not two depending on where it failed.
    if (isUnroutableBalanceError(err)) {
      throw new UnroutableBalance(intent.amount, err);
    }
    throw new MorvaSdkError(`Failed to build payment transaction: ${describeError(err)}`, { cause: err });
  }

  onStatus("authorizing");
  const authorizations = await tryAuthorizationStep(
    () => signPendingAuthorizations(transaction, signer),
    onStatus
  );

  onStatus("signing");
  const signature = await tryAuthorizationStep(async () => {
    const messageBytes = hexToBytes(transaction.rootHash as Hex);
    return signer.signMessage(messageBytes);
  }, onStatus);

  // Baseline for the balance-delta settlement fallback, captured BEFORE
  // submission — not on the first poll iteration. Capturing it after
  // sendTransaction (the previous behavior) meant a same-chain transfer
  // that settled in the first few seconds would already be reflected in
  // the "before" reading, so the delta check could never fire and a
  // successful payment could time out as if it had failed.
  let baseline: SettlementBaseline;
  try {
    baseline = await computeSettlementBaseline(intent, opts);
  } catch (err) {
    onStatus("failed");
    throw new MorvaSdkError(`Failed to prepare settlement detection: ${describeError(err)}`, { cause: err });
  }

  const result = await tryStep(
    () => ua.sendTransaction(transaction, signature, authorizations),
    "Failed to submit payment transaction",
    onStatus
  );
  onStatus("submitted");

  const transactionId: string = result.transactionId;
  await finalizeSettlement(ua, transactionId, intent, opts, onStatus, onDebug, baseline);

  return { transactionId, explorerUrl: buildExplorerUrl(transactionId) };
}

/**
 * Builds the actual transfer. This deliberately does NOT always call
 * ua.createTransferTransaction() — that method (internally tagged
 * "transfer_v2") was confirmed via direct, repeated live testing to
 * reject payments needing meaningful cross-chain sourcing as
 * "Insufficient primary token balance" (code -32653), even against a
 * wallet with genuinely sufficient funds spread across chains — e.g. a
 * buyer holding $0.94 on the settlement chain and $0.80 on another chain
 * could not complete a $1.20 payment, no matter how much of that $0.80
 * should have been routable.
 *
 * Particle's own reference implementation
 * (github.com/Particle-Network/universal-accounts-7702, TransferCard.tsx)
 * does not use createTransferTransaction for this "pay an address on a
 * specific chain from cross-chain balance" case either — it uses
 * createUniversalTransaction() with an explicit expectTokens requirement
 * plus a raw ERC-20 transfer() call. Re-running the exact same amounts
 * that failed above through createUniversalTransaction instead succeeded
 * for every one of them, still via the same real Particle backend.
 *
 * expectTokens only accepts Particle's small closed set of "primary"
 * token types (ETH/USDT/USDC/BNB/SOL) — getSupportedToken(chainId,
 * address), also public on the SDK, is what tells us whether
 * intent.settlementToken is one of them. For a settlement token outside
 * that set (an exotic ERC-20 with no primary-asset routing, e.g. an
 * NFT-drop token), createUniversalTransaction's expectTokens literally
 * cannot express the request, so this falls back to
 * createTransferTransaction — same as before, and still correct for
 * amounts the settlement chain already holds without needing real
 * cross-chain sourcing.
 */
async function buildTransferTransaction(
  ua: UniversalAccount,
  intent: PaymentIntent
): Promise<Awaited<ReturnType<UniversalAccount["createTransferTransaction"]>>> {
  const supportedToken = getSupportedToken(intent.settlementChainId, intent.settlementToken);

  if (!supportedToken?.type) {
    return ua.createTransferTransaction({
      token: { chainId: intent.settlementChainId, address: intent.settlementToken },
      amount: intent.amount,
      receiver: intent.settlementRecipient,
    });
  }

  const amountBaseUnits = parseUnits(intent.amount, supportedToken.realDecimals);
  const isNativeToken = intent.settlementToken.toLowerCase() === zeroAddress;

  return ua.createUniversalTransaction({
    chainId: intent.settlementChainId,
    expectTokens: [{ type: supportedToken.type, amount: intent.amount }],
    transactions: [
      isNativeToken
        ? { to: intent.settlementRecipient, value: toHex(amountBaseUnits), data: "0x" }
        : {
            to: intent.settlementToken,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "transfer",
              args: [intent.settlementRecipient, amountBaseUnits],
            }),
          },
    ],
  });
}

/** Waits for settlement and translates the outcome into the right
 *  onStatus signal: "settled" on success, "unknown" (not "failed") on a
 *  SettlementTimeout — since that specifically means unresolved, not
 *  confirmed-wrong — and "failed" only for a confirmed on-chain failure
 *  or any other error. */
async function finalizeSettlement(
  ua: UniversalAccount,
  transactionId: string,
  intent: PaymentIntent,
  opts: PayOptions,
  onStatus: (status: PaymentStatus) => void,
  onDebug: (event: string, detail?: Record<string, unknown>) => void,
  precomputedBaseline?: SettlementBaseline
): Promise<void> {
  try {
    const baseline = precomputedBaseline ?? (await computeSettlementBaseline(intent, opts));
    await waitForSettlement(ua, transactionId, intent, {
      timeoutMs: opts.settlementTimeoutMs ?? DEFAULT_SETTLEMENT_TIMEOUT_MS,
      onDebug,
      ...baseline,
    });
  } catch (err) {
    onStatus(err instanceof SettlementTimeout ? "unknown" : "failed");
    throw err;
  }
  onStatus("settled");
}

async function tryStep<T>(
  fn: () => Promise<T>,
  message: string,
  onStatus: (status: PaymentStatus) => void
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    onStatus("failed");
    // The underlying reason (e.g. Particle's own "Insufficient primary
    // token balance") is folded into the message itself, not just left on
    // .cause — callers that show err.message directly to a buyer, or log
    // it without unwrapping .cause, still see the real reason instead of
    // this generic wrapper alone.
    throw new MorvaSdkError(`${message}: ${describeError(err)}`, { cause: err });
  }
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function errorCode(err: unknown): unknown {
  return typeof err === "object" && err !== null ? (err as { code?: unknown }).code : undefined;
}

/** Particle's UniversalError carries this as .code (confirmed via live
 *  testing against real wallets); matched on message too since neither
 *  the code nor the message format is documented as a stable contract. */
function isUnroutableBalanceError(err: unknown): boolean {
  if (errorCode(err) === -32653) return true;
  return /insufficient primary token balance/i.test(describeError(err));
}

/** EIP-1193's standard user-rejection code, plus a message fallback for
 *  signers that don't surface it — anything else (a network error, a
 *  malformed request, a signer bug) is NOT a user rejection and must not
 *  be reported as one. */
function isUserRejection(err: unknown): boolean {
  if (errorCode(err) === 4001) return true;
  return /user rejected|user denied|rejected the request/i.test(describeError(err));
}

async function tryAuthorizationStep<T>(
  fn: () => Promise<T>,
  onStatus: (status: PaymentStatus) => void
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    onStatus("failed");
    if (isUserRejection(err)) throw new UserRejectedSignature(err);
    // Anything else — a network failure, a malformed rootHash, a signer
    // bug — is not the buyer cancelling, and must not be reported to a
    // checkout UI (or counted in abandonment analytics) as if it were.
    throw new MorvaSdkError(`Signature request failed: ${describeError(err)}`, { cause: err });
  }
}

interface SettlementBaseline {
  publicClient: PublicClient;
  expectedAmountBaseUnits: bigint;
  balanceBefore: bigint;
}

/** Reads the settlement token's decimals and the recipient's current
 *  balance once, before submission (or, for a resumed payment, once at
 *  resume time — an inherently weaker baseline, since a payment may have
 *  already landed before this process started polling for it; getTransaction()
 *  is the authoritative signal in that case, this is only the fallback). */
async function computeSettlementBaseline(intent: PaymentIntent, opts: PayOptions): Promise<SettlementBaseline> {
  const publicClient = createPublicClient({
    chain: getSettlementViemChain(intent.settlementChainId),
    transport: http(
      opts.settlementRpcUrls?.[intent.settlementChainId] ?? getDefaultSettlementRpcUrl(intent.settlementChainId)
    ),
  });

  const [decimals, balanceBefore] = await Promise.all([
    publicClient.readContract({
      address: intent.settlementToken,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    readRecipientBalance(intent, publicClient),
  ]);

  return {
    publicClient,
    expectedAmountBaseUnits: parseUnits(intent.amount, decimals),
    balanceBefore,
  };
}

/**
 * NOTE: ua.getTransaction()'s response is untyped (`Promise<any>`) in the
 * installed SDK (2.0.3) and this codebase has no confirmed sample of its
 * real shape for a settled transfer. UA_TRANSACTION_STATUS is exported
 * and strongly implies a numeric `.status` field, so that's tried first —
 * but if it never resolves to a recognized terminal value before the
 * timeout, this falls back to comparing the recipient's on-chain ERC-20
 * balance against a pre-submission baseline plus the exact expected
 * amount (not "any balance increase" — the settlement recipient is a
 * merchant receiving payments from many buyers concurrently, so an
 * unrelated inflow during this poll window must never be mistaken for
 * this payment).
 */
async function waitForSettlement(
  ua: UniversalAccount,
  transactionId: string,
  intent: PaymentIntent,
  opts: {
    timeoutMs: number;
    publicClient: PublicClient;
    expectedAmountBaseUnits: bigint;
    balanceBefore: bigint;
    onDebug: (event: string, detail?: Record<string, unknown>) => void;
  }
): Promise<void> {
  const { timeoutMs, publicClient, expectedAmountBaseUnits, balanceBefore, onDebug } = opts;
  const deadline = Date.now() + timeoutMs;
  const requiredBalance = balanceBefore + expectedAmountBaseUnits;

  while (Date.now() < deadline) {
    try {
      const status = (await ua.getTransaction(transactionId)) as { status?: number } | undefined;
      const code = status?.status;
      if (code === UA_TRANSACTION_STATUS.FINISHED) {
        onDebug("settlement_resolved", { via: "getTransaction", transactionId });
        return;
      }
      if (code !== undefined && FAILED_STATUS_CODES.includes(code)) {
        onDebug("settlement_failed_confirmed", { transactionId, code });
        throw new MorvaSdkError(
          `Transaction ${transactionId} settled as failed/refunded (status ${code})`
        );
      }
    } catch (err) {
      if (err instanceof MorvaSdkError) throw err;
      onDebug("get_transaction_error", { transactionId, error: describeError(err) });
      // getTransaction() itself failing transiently — fall through to the
      // balance check below rather than aborting the whole payment.
    }

    try {
      const currentBalance = await readRecipientBalance(intent, publicClient);
      if (currentBalance >= requiredBalance) {
        onDebug("settlement_resolved", { via: "balance_delta", transactionId });
        return;
      }
    } catch (err) {
      // A transient RPC error here (rate limit, timeout — the default is
      // a public RPC) must never abort a payment that may already be
      // mid-flight. Skip this poll, try again next interval.
      onDebug("balance_poll_error", { transactionId, error: describeError(err) });
    }

    await sleep(POLL_INTERVAL_MS);
  }

  onDebug("settlement_timeout", { transactionId });
  throw new SettlementTimeout(transactionId, timeoutMs);
}

async function readRecipientBalance(
  intent: PaymentIntent,
  publicClient: PublicClient
): Promise<bigint> {
  return publicClient.readContract({
    address: intent.settlementToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [intent.settlementRecipient],
  }) as Promise<bigint>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
