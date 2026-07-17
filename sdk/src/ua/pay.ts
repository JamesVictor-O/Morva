import { createPublicClient, erc20Abi, hexToBytes, http, type Hex } from "viem";
import { arbitrum } from "viem/chains";
import { CHAIN_ID, UA_TRANSACTION_STATUS, type UniversalAccount } from "@particle-network/universal-account-sdk";
import { DEFAULT_ARBITRUM_RPC_URL, DEFAULT_SETTLEMENT_TIMEOUT_MS, isUsdPeggedStablecoin } from "../config";
import { InsufficientUnifiedBalance, MorvaSdkError, SettlementTimeout, UserRejectedSignature } from "../errors";
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
  | "failed";

export interface PaymentResult {
  transactionId: string;
  explorerUrl: string;
}

export interface PayOptions {
  onStatus?: (status: PaymentStatus) => void;
  /** Default 120_000ms. */
  settlementTimeoutMs?: number;
  rpcUrl?: string;
}

const POLL_INTERVAL_MS = 3_000;

const FAILED_STATUS_CODES: number[] = [
  UA_TRANSACTION_STATUS.EXECUTION_FAILED,
  UA_TRANSACTION_STATUS.REFUND_FAILED,
  UA_TRANSACTION_STATUS.REFUND_FINISHED,
  UA_TRANSACTION_STATUS.PENNY_FAILED,
];

export async function pay(
  ua: UniversalAccount,
  signer: MorvaSigner,
  intent: PaymentIntent,
  opts: PayOptions = {}
): Promise<PaymentResult> {
  const onStatus = opts.onStatus ?? (() => {});

  onStatus("building");

  // Only a meaningful comparison when the settlement token is itself a
  // ~1:1 USD stablecoin — intent.amount is in settlementToken units, not
  // USD. For any other token (ETH, WETH, an NFT-collection token, ...)
  // this is skipped; an actually-insufficient balance still surfaces
  // below, from the real transfer attempt, as a MorvaSdkError.
  const balance = await getUnifiedBalance(ua);
  if (isUsdPeggedStablecoin(intent.settlementToken) && Number(balance.totalUsd) < Number(intent.amount)) {
    onStatus("failed");
    throw new InsufficientUnifiedBalance(intent.amount, balance.totalUsd);
  }

  const transaction = await tryStep(
    () =>
      ua.createTransferTransaction({
        token: { chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE, address: intent.settlementToken },
        amount: intent.amount,
        receiver: intent.settlementRecipient,
      }),
    "Failed to build payment transaction",
    onStatus
  );

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

  const result = await tryStep(
    () => ua.sendTransaction(transaction, signature, authorizations),
    "Failed to submit payment transaction",
    onStatus
  );
  onStatus("submitted");

  const transactionId: string = result.transactionId;
  const explorerUrl = `https://universalx.app/activity/details?id=${transactionId}`;

  try {
    await waitForSettlement(ua, transactionId, intent, {
      timeoutMs: opts.settlementTimeoutMs ?? DEFAULT_SETTLEMENT_TIMEOUT_MS,
      rpcUrl: opts.rpcUrl,
    });
  } catch (err) {
    onStatus("failed");
    throw err;
  }
  onStatus("settled");

  return { transactionId, explorerUrl };
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
    throw new MorvaSdkError(message, { cause: err });
  }
}

async function tryAuthorizationStep<T>(
  fn: () => Promise<T>,
  onStatus: (status: PaymentStatus) => void
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    onStatus("failed");
    throw new UserRejectedSignature(err);
  }
}

/**
 * NOTE: ua.getTransaction()'s response is untyped (`Promise<any>`) in the
 * installed SDK (2.0.3) and this codebase has no confirmed sample of its
 * real shape for a settled transfer. UA_TRANSACTION_STATUS is exported
 * and strongly implies a numeric `.status` field, so that's tried first —
 * but if it never resolves to a recognized terminal value before the
 * timeout, this falls back to polling the recipient's on-chain ERC-20
 * balance directly via viem, per the task brief's explicit fallback
 * instruction. scripts/e2e-payment.ts (Gate 2) is what actually proves
 * which signal fires in practice; harden this once that's run.
 */
async function waitForSettlement(
  ua: UniversalAccount,
  transactionId: string,
  intent: PaymentIntent,
  opts: { timeoutMs: number; rpcUrl?: string }
): Promise<void> {
  const deadline = Date.now() + opts.timeoutMs;
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(opts.rpcUrl ?? DEFAULT_ARBITRUM_RPC_URL),
  });

  let balanceBefore: bigint | undefined;

  while (Date.now() < deadline) {
    try {
      const status = (await ua.getTransaction(transactionId)) as { status?: number } | undefined;
      const code = status?.status;
      if (code === UA_TRANSACTION_STATUS.FINISHED) return;
      if (code !== undefined && FAILED_STATUS_CODES.includes(code)) {
        throw new MorvaSdkError(
          `Transaction ${transactionId} settled as failed/refunded (status ${code})`
        );
      }
    } catch (err) {
      if (err instanceof MorvaSdkError) throw err;
      // getTransaction() itself failing transiently — fall through to the
      // balance check below rather than aborting the whole payment.
    }

    const currentBalance = await readRecipientBalance(intent, publicClient);
    if (balanceBefore === undefined) {
      balanceBefore = currentBalance;
    } else if (currentBalance > balanceBefore) {
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new SettlementTimeout(transactionId, opts.timeoutMs);
}

async function readRecipientBalance(
  intent: PaymentIntent,
  publicClient: ReturnType<typeof createPublicClient>
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
