import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UA_TRANSACTION_STATUS, type ITransaction, type IUserOpWithChain, type UniversalAccount } from "@particle-network/universal-account-sdk";
import {
  InsufficientUnifiedBalance,
  MorvaSdkError,
  SettlementTimeout,
  UnroutableBalance,
  UserRejectedSignature,
} from "../src/errors";
import type { PaymentIntent } from "../src/intents";
import type { MorvaSigner } from "../src/ua/signer";

const { readContract, createPublicClientMock } = vi.hoisted(() => {
  const readContract = vi.fn();
  return { readContract, createPublicClientMock: vi.fn(() => ({ readContract })) };
});

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return { ...actual, createPublicClient: createPublicClientMock };
});

const { pay } = await import("../src/ua/pay");

const TOKEN = "0x3333333333333333333333333333333333333333" as const;
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
const RECIPIENT = "0x4444444444444444444444444444444444444444" as const;
const ROOT_HASH = `0x${"ab".repeat(32)}` as const;

/** decimals() always returns `decimals`; balanceOf() returns the next
 *  value off `balanceOfSequence` each call (clamped to the last entry
 *  once exhausted) — call 0 is always the pre-submission baseline read. */
function mockReadContract(balanceOfSequence: bigint[], decimals = 6) {
  let balanceOfCalls = 0;
  readContract.mockImplementation(({ functionName }: { functionName: string }) => {
    if (functionName === "decimals") return Promise.resolve(decimals);
    const value = balanceOfSequence[Math.min(balanceOfCalls, balanceOfSequence.length - 1)];
    balanceOfCalls += 1;
    return Promise.resolve(value);
  });
}

function paymentIntent(overrides: Partial<PaymentIntent> = {}): PaymentIntent {
  return {
    orderId: "order-1",
    amount: "10.00",
    settlementToken: TOKEN,
    settlementRecipient: RECIPIENT,
    settlementChainId: 42161,
    ...overrides,
  } as PaymentIntent;
}

function transaction(overrides: Partial<ITransaction> = {}): ITransaction {
  return {
    rootHash: ROOT_HASH,
    userOps: [] as IUserOpWithChain[],
    ...overrides,
  } as unknown as ITransaction;
}

function pendingUserOp(): IUserOpWithChain {
  return {
    chainId: 42161,
    userOp: {} as IUserOpWithChain["userOp"],
    txs: [],
    feeDeductions: [],
    gasFeeInUSD: "0",
    userOpHash: "0xa",
    expiredAt: 0,
    startBlock: 0,
    eip7702Auth: { chainId: 42161, nonce: 0, address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  } as IUserOpWithChain;
}

function mockUa(overrides: Partial<UniversalAccount> = {}): UniversalAccount {
  return {
    getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [], totalAmountInUSD: 100 }),
    createTransferTransaction: vi.fn().mockResolvedValue(transaction()),
    sendTransaction: vi.fn().mockResolvedValue({ transactionId: "tx-1" }),
    getTransaction: vi.fn().mockResolvedValue({ status: UA_TRANSACTION_STATUS.FINISHED }),
    ...overrides,
  } as unknown as UniversalAccount;
}

function mockSigner(overrides: Partial<MorvaSigner> = {}): MorvaSigner {
  return {
    address: "0x0000000000000000000000000000000000000001",
    signMessage: vi.fn().mockResolvedValue("0xsignature"),
    signAuthorization: vi.fn().mockResolvedValue({
      address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      chainId: 42161,
      nonce: 0,
      r: `0x${"1".repeat(64)}`,
      s: `0x${"2".repeat(64)}`,
      yParity: 0,
    }),
    ...overrides,
  } as MorvaSigner;
}

/** Shaped like a real EIP-1193 rejection (code 4001) — what an actual
 *  "buyer closed the wallet" looks like, as opposed to an arbitrary Error. */
function rejectionError(message = "User rejected the request"): Error {
  return Object.assign(new Error(message), { code: 4001 });
}

/** Shaped like Particle's real UniversalError for this exact condition —
 *  confirmed via live testing against real wallets (code -32653). */
function unroutableBalanceError(): Error {
  return Object.assign(new Error("Insufficient primary token balance"), { code: -32653 });
}

beforeEach(() => {
  readContract.mockReset();
  mockReadContract([0n]); // sensible default: baseline 0, never rises
  createPublicClientMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pay", () => {
  it("throws InsufficientUnifiedBalance without building a transaction when settling in a USD stablecoin and balance is too low", async () => {
    const ua = mockUa({ getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [], totalAmountInUSD: 5 }) });
    const onStatus = vi.fn();

    await expect(
      pay(ua, mockSigner(), paymentIntent({ amount: "10.00", settlementToken: USDC }), { onStatus })
    ).rejects.toBeInstanceOf(InsufficientUnifiedBalance);

    expect(ua.createTransferTransaction).not.toHaveBeenCalled();
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "failed"]);
  });

  it("skips the USD pre-flight check for a non-stablecoin settlement token, even when totalUsd is far below the raw amount", async () => {
    // amount "10.00" here means 10 units of TOKEN (e.g. an NFT-priced ERC-20),
    // not $10 — a $5 unified balance says nothing about whether 10 units of
    // an arbitrary token are affordable, so the naive USD comparison must
    // not fire. The real transfer attempt is what determines affordability.
    const ua = mockUa({ getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [], totalAmountInUSD: 5 }) });
    const onStatus = vi.fn();

    const result = await pay(ua, mockSigner(), paymentIntent({ amount: "10.00", settlementToken: TOKEN }), {
      onStatus,
    });

    expect(result.transactionId).toBe("tx-1");
    expect(ua.createTransferTransaction).toHaveBeenCalledWith({
      token: { chainId: 42161, address: TOKEN },
      amount: "10.00",
      receiver: RECIPIENT,
    });
  });

  it("settles to a non-default chain (Base) when the intent specifies one", async () => {
    const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
    const ua = mockUa({ getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [], totalAmountInUSD: 100 }) });
    const onStatus = vi.fn();

    const result = await pay(
      ua,
      mockSigner(),
      paymentIntent({ amount: "10.00", settlementToken: BASE_USDC, settlementChainId: 8453 }),
      { onStatus }
    );

    expect(result.transactionId).toBe("tx-1");
    expect(ua.createTransferTransaction).toHaveBeenCalledWith({
      token: { chainId: 8453, address: BASE_USDC },
      amount: "10.00",
      receiver: RECIPIENT,
    });
  });

  it("runs the full lifecycle and resolves with the transaction id and explorer url", async () => {
    const ua = mockUa();
    const signer = mockSigner();
    const onStatus = vi.fn();
    const intent = paymentIntent();

    const result = await pay(ua, signer, intent, { onStatus });

    expect(result).toEqual({
      transactionId: "tx-1",
      explorerUrl: "https://universalx.app/activity/details?id=tx-1",
    });
    expect(ua.createTransferTransaction).toHaveBeenCalledWith({
      token: { chainId: 42161, address: TOKEN },
      amount: "10.00",
      receiver: RECIPIENT,
    });
    expect(ua.sendTransaction).toHaveBeenCalledWith(expect.anything(), "0xsignature", undefined);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual([
      "building",
      "authorizing",
      "signing",
      "submitted",
      "settled",
    ]);
  });

  it("uses a custom buildExplorerUrl when provided", async () => {
    const ua = mockUa();
    const result = await pay(ua, mockSigner(), paymentIntent(), {
      buildExplorerUrl: (transactionId) => `https://example.com/tx/${transactionId}`,
    });

    expect(result.explorerUrl).toBe("https://example.com/tx/tx-1");
  });

  it("wraps a failing createTransferTransaction in MorvaSdkError", async () => {
    const ua = mockUa({ createTransferTransaction: vi.fn().mockRejectedValue(new Error("rpc down")) });
    const onStatus = vi.fn();

    await expect(pay(ua, mockSigner(), paymentIntent(), { onStatus })).rejects.toBeInstanceOf(MorvaSdkError);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "failed"]);
  });

  it("maps Particle's -32653 'Insufficient primary token balance' to UnroutableBalance, distinct from a generic build failure", async () => {
    const ua = mockUa({ createTransferTransaction: vi.fn().mockRejectedValue(unroutableBalanceError()) });
    const onStatus = vi.fn();

    const err = await pay(ua, mockSigner(), paymentIntent(), { onStatus }).catch((e) => e);

    expect(err).toBeInstanceOf(UnroutableBalance);
    expect(err).toBeInstanceOf(MorvaSdkError); // UnroutableBalance extends MorvaSdkError
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "failed"]);
  });

  it("wraps a rejected authorization signature as UserRejectedSignature when it's a real EIP-1193 rejection", async () => {
    const ua = mockUa({ createTransferTransaction: vi.fn().mockResolvedValue(transaction({ userOps: [pendingUserOp()] })) });
    const signer = mockSigner({ signAuthorization: vi.fn().mockRejectedValue(rejectionError()) });
    const onStatus = vi.fn();

    await expect(pay(ua, signer, paymentIntent(), { onStatus })).rejects.toBeInstanceOf(UserRejectedSignature);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "authorizing", "failed"]);
  });

  it("does NOT report a non-rejection authorization failure as UserRejectedSignature", async () => {
    // A network blip or a signer bug is not the buyer cancelling — a
    // checkout UI must not tell them "you cancelled" for this, and
    // abandonment analytics must not count it as one either.
    const ua = mockUa({ createTransferTransaction: vi.fn().mockResolvedValue(transaction({ userOps: [pendingUserOp()] })) });
    const signer = mockSigner({ signAuthorization: vi.fn().mockRejectedValue(new Error("network timeout")) });
    const onStatus = vi.fn();

    const err = await pay(ua, signer, paymentIntent(), { onStatus }).catch((e) => e);
    expect(err).toBeInstanceOf(MorvaSdkError);
    expect(err).not.toBeInstanceOf(UserRejectedSignature);
    expect((err as Error).message).toMatch(/network timeout/);
  });

  it("wraps a rejected message signature as UserRejectedSignature when it's a real EIP-1193 rejection", async () => {
    const ua = mockUa();
    const signer = mockSigner({ signMessage: vi.fn().mockRejectedValue(rejectionError("User rejected")) });
    const onStatus = vi.fn();

    await expect(pay(ua, signer, paymentIntent(), { onStatus })).rejects.toBeInstanceOf(UserRejectedSignature);
    expect(ua.sendTransaction).not.toHaveBeenCalled();
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "authorizing", "signing", "failed"]);
  });

  it("wraps a failing sendTransaction in MorvaSdkError without emitting submitted", async () => {
    const ua = mockUa({ sendTransaction: vi.fn().mockRejectedValue(new Error("relayer rejected")) });
    const onStatus = vi.fn();

    await expect(pay(ua, mockSigner(), paymentIntent(), { onStatus })).rejects.toBeInstanceOf(MorvaSdkError);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "authorizing", "signing", "failed"]);
  });

  it("throws when the transaction settles as failed/refunded, and reports 'failed' (a confirmed outcome)", async () => {
    const ua = mockUa({ getTransaction: vi.fn().mockResolvedValue({ status: UA_TRANSACTION_STATUS.EXECUTION_FAILED }) });
    const onStatus = vi.fn();

    await expect(pay(ua, mockSigner(), paymentIntent(), { onStatus })).rejects.toThrow(/settled as failed\/refunded/);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual([
      "building",
      "authorizing",
      "signing",
      "submitted",
      "failed",
    ]);
  });

  describe("settlement detection fallback", () => {
    it("resolves on the very first poll when the baseline was captured before submission (no longer needs a second iteration)", async () => {
      vi.useFakeTimers();
      // amount "10.00" @ 6 decimals = 10_000_000n base units. Baseline 0,
      // first (and only) poll already at the full expected amount.
      mockReadContract([0n, 10_000_000n]);
      const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
      const onStatus = vi.fn();

      const promise = pay(ua, mockSigner(), paymentIntent(), { onStatus, settlementTimeoutMs: 60_000 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.transactionId).toBe("tx-1");
      expect(onStatus.mock.calls.at(-1)?.[0]).toBe("settled");
    });

    it("does NOT mistake an unrelated smaller inflow (e.g. a different buyer's payment) for this payment settling", async () => {
      vi.useFakeTimers();
      // Baseline 0, then a smaller inflow (3 of 10 expected) that never
      // reaches the full expected amount — must not resolve as settled.
      mockReadContract([0n, 3_000_000n, 3_000_000n, 3_000_000n]);
      const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
      const onStatus = vi.fn();

      const promise = pay(ua, mockSigner(), paymentIntent(), { onStatus, settlementTimeoutMs: 7_000 });
      const assertion = expect(promise).rejects.toBeInstanceOf(SettlementTimeout);
      await vi.runAllTimersAsync();
      await assertion;
    });

    it("tolerates a transient RPC error reading the recipient's balance mid-poll instead of aborting", async () => {
      vi.useFakeTimers();
      let call = 0;
      readContract.mockImplementation(({ functionName }: { functionName: string }) => {
        if (functionName === "decimals") return Promise.resolve(6);
        call += 1;
        if (call === 1) return Promise.resolve(0n); // baseline
        if (call === 2) return Promise.reject(new Error("rate limited")); // transient
        return Promise.resolve(10_000_000n); // settles on the next poll
      });
      const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
      const onStatus = vi.fn();

      const promise = pay(ua, mockSigner(), paymentIntent(), { onStatus, settlementTimeoutMs: 60_000 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.transactionId).toBe("tx-1");
      expect(onStatus.mock.calls.at(-1)?.[0]).toBe("settled");
    });

    it("reports 'unknown', not 'failed', when settlement can't be confirmed within the timeout", async () => {
      // A SettlementTimeout means genuinely unresolved — the payment may
      // still land — and must never be reported the same way as a
      // confirmed on-chain failure.
      vi.useFakeTimers();
      mockReadContract([0n]); // never rises
      const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
      const onStatus = vi.fn();

      const promise = pay(ua, mockSigner(), paymentIntent(), { onStatus, settlementTimeoutMs: 7_000 });
      const assertion = expect(promise).rejects.toBeInstanceOf(SettlementTimeout);
      await vi.runAllTimersAsync();
      await assertion;

      expect(onStatus.mock.calls.at(-1)?.[0]).toBe("unknown");
      expect(onStatus.mock.calls.map((c) => c[0])).not.toContain("failed");
    });

    it("carries the transactionId on the thrown SettlementTimeout for later resumption", async () => {
      vi.useFakeTimers();
      mockReadContract([0n]);
      const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });

      const promise = pay(ua, mockSigner(), paymentIntent(), { settlementTimeoutMs: 7_000 });
      const assertion = promise.catch((e) => e);
      await vi.runAllTimersAsync();
      const err = await assertion;

      expect(err).toBeInstanceOf(SettlementTimeout);
      expect((err as SettlementTimeout).transactionId).toBe("tx-1");
    });
  });

  describe("resumeTransactionId", () => {
    it("skips building/authorizing/signing/submitting entirely and polls the existing transaction instead", async () => {
      const ua = mockUa();
      const onStatus = vi.fn();

      const result = await pay(ua, mockSigner(), paymentIntent(), {
        onStatus,
        resumeTransactionId: "tx-from-earlier-attempt",
      });

      expect(result.transactionId).toBe("tx-from-earlier-attempt");
      expect(ua.createTransferTransaction).not.toHaveBeenCalled();
      expect(ua.sendTransaction).not.toHaveBeenCalled();
      expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["submitted", "settled"]);
    });

    it("still distinguishes unknown vs failed when resuming", async () => {
      vi.useFakeTimers();
      mockReadContract([0n]);
      const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
      const onStatus = vi.fn();

      const promise = pay(ua, mockSigner(), paymentIntent(), {
        onStatus,
        resumeTransactionId: "tx-from-earlier-attempt",
        settlementTimeoutMs: 7_000,
      });
      const assertion = expect(promise).rejects.toBeInstanceOf(SettlementTimeout);
      await vi.runAllTimersAsync();
      await assertion;

      expect(onStatus.mock.calls.at(-1)?.[0]).toBe("unknown");
    });
  });
});
