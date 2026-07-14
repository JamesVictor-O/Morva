import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UA_TRANSACTION_STATUS, type ITransaction, type IUserOpWithChain, type UniversalAccount } from "@particle-network/universal-account-sdk";
import { InsufficientUnifiedBalance, MorvaSdkError, SettlementTimeout, UserRejectedSignature } from "../src/errors";
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
const RECIPIENT = "0x4444444444444444444444444444444444444444" as const;
const ROOT_HASH = `0x${"ab".repeat(32)}` as const;

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

beforeEach(() => {
  readContract.mockReset();
  createPublicClientMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pay", () => {
  it("throws InsufficientUnifiedBalance without building a transaction when balance is too low", async () => {
    const ua = mockUa({ getPrimaryAssets: vi.fn().mockResolvedValue({ assets: [], totalAmountInUSD: 5 }) });
    const onStatus = vi.fn();

    await expect(pay(ua, mockSigner(), paymentIntent({ amount: "10.00" }), { onStatus })).rejects.toBeInstanceOf(
      InsufficientUnifiedBalance
    );

    expect(ua.createTransferTransaction).not.toHaveBeenCalled();
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "failed"]);
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

  it("wraps a failing createTransferTransaction in MorvaSdkError", async () => {
    const ua = mockUa({ createTransferTransaction: vi.fn().mockRejectedValue(new Error("rpc down")) });
    const onStatus = vi.fn();

    await expect(pay(ua, mockSigner(), paymentIntent(), { onStatus })).rejects.toBeInstanceOf(MorvaSdkError);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "failed"]);
  });

  it("wraps a rejected authorization signature as UserRejectedSignature", async () => {
    const ua = mockUa({ createTransferTransaction: vi.fn().mockResolvedValue(transaction({ userOps: [pendingUserOp()] })) });
    const signer = mockSigner({ signAuthorization: vi.fn().mockRejectedValue(new Error("user closed wallet")) });
    const onStatus = vi.fn();

    await expect(pay(ua, signer, paymentIntent(), { onStatus })).rejects.toBeInstanceOf(UserRejectedSignature);
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(["building", "authorizing", "failed"]);
  });

  it("wraps a rejected message signature as UserRejectedSignature", async () => {
    const ua = mockUa();
    const signer = mockSigner({ signMessage: vi.fn().mockRejectedValue(new Error("user closed wallet")) });
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

  it("throws when the transaction settles as failed/refunded, and still emits failed", async () => {
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

  it("falls back to polling the recipient's on-chain balance and resolves once it rises", async () => {
    vi.useFakeTimers();
    const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
    readContract.mockResolvedValueOnce(100n).mockResolvedValueOnce(150n);
    const onStatus = vi.fn();

    const promise = pay(ua, mockSigner(), paymentIntent(), { onStatus, settlementTimeoutMs: 60_000 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.transactionId).toBe("tx-1");
    expect(readContract).toHaveBeenCalledTimes(2);
    expect(onStatus.mock.calls.at(-1)?.[0]).toBe("settled");
  });

  it("throws SettlementTimeout and emits failed when the balance never rises before the deadline", async () => {
    vi.useFakeTimers();
    const ua = mockUa({ getTransaction: vi.fn().mockRejectedValue(new Error("not indexed yet")) });
    readContract.mockResolvedValue(500n);
    const onStatus = vi.fn();

    const promise = pay(ua, mockSigner(), paymentIntent(), { onStatus, settlementTimeoutMs: 7_000 });
    const assertion = expect(promise).rejects.toBeInstanceOf(SettlementTimeout);
    await vi.runAllTimersAsync();
    await assertion;

    expect(onStatus.mock.calls.at(-1)?.[0]).toBe("failed");
  });
});
