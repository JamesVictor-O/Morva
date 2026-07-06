import { describe, expect, it, vi } from "vitest";
import type { ITransaction, IUserOpWithChain } from "@particle-network/universal-account-sdk";
import { signPendingAuthorizations } from "../src/ua/authorization";
import type { MorvaSigner } from "../src/ua/signer";

const CONTRACT = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;

function userOp(overrides: Partial<IUserOpWithChain> = {}): IUserOpWithChain {
  return {
    chainId: 8453,
    userOp: {} as IUserOpWithChain["userOp"],
    txs: [],
    feeDeductions: [],
    gasFeeInUSD: "0",
    userOpHash: "0xhash",
    expiredAt: 0,
    startBlock: 0,
    ...overrides,
  } as IUserOpWithChain;
}

function transaction(userOps: IUserOpWithChain[]): ITransaction {
  return { userOps } as unknown as ITransaction;
}

function mockSigner(): MorvaSigner {
  let call = 0;
  return {
    address: "0x0000000000000000000000000000000000000001",
    signMessage: vi.fn(),
    signAuthorization: vi.fn(async (auth) => {
      call += 1;
      // Distinct r per call so signatures are distinguishable in assertions.
      return {
        address: auth.contractAddress,
        chainId: auth.chainId,
        nonce: auth.nonce,
        r: `0x${String(call).padStart(64, "0")}` as `0x${string}`,
        s: `0x${"1".repeat(64)}` as `0x${string}`,
        yParity: 0,
      };
    }),
  };
}

describe("signPendingAuthorizations", () => {
  it("returns undefined when no userOp has a pending authorization", async () => {
    const signer = mockSigner();
    const tx = transaction([
      userOp({ userOpHash: "0xa" }),
      userOp({ userOpHash: "0xb", eip7702Delegated: true, eip7702Auth: { chainId: 8453, nonce: 0, address: CONTRACT } }),
    ]);

    const result = await signPendingAuthorizations(tx, signer);

    expect(result).toBeUndefined();
    expect(signer.signAuthorization).not.toHaveBeenCalled();
  });

  it("signs a single pending authorization", async () => {
    const signer = mockSigner();
    const tx = transaction([
      userOp({ userOpHash: "0xa", eip7702Auth: { chainId: 8453, nonce: 0, address: CONTRACT } }),
    ]);

    const result = await signPendingAuthorizations(tx, signer);

    expect(signer.signAuthorization).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result?.[0].userOpHash).toBe("0xa");
  });

  it("dedupes two userOps on the same chain sharing an authorization nonce into ONE signature", async () => {
    const signer = mockSigner();
    const tx = transaction([
      userOp({ userOpHash: "0xa", chainId: 8453, eip7702Auth: { chainId: 8453, nonce: 5, address: CONTRACT } }),
      userOp({ userOpHash: "0xb", chainId: 8453, eip7702Auth: { chainId: 8453, nonce: 5, address: CONTRACT } }),
    ]);

    const result = await signPendingAuthorizations(tx, signer);

    expect(signer.signAuthorization).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result?.[0].signature).toBe(result?.[1].signature);
    expect(result?.map((a) => a.userOpHash)).toEqual(["0xa", "0xb"]);
  });

  it("signs separately for two different chains even when they share the same nonce value", async () => {
    const signer = mockSigner();
    const tx = transaction([
      userOp({ userOpHash: "0xa", chainId: 8453, eip7702Auth: { chainId: 8453, nonce: 0, address: CONTRACT } }),
      userOp({ userOpHash: "0xb", chainId: 42161, eip7702Auth: { chainId: 42161, nonce: 0, address: CONTRACT } }),
    ]);

    const result = await signPendingAuthorizations(tx, signer);

    expect(signer.signAuthorization).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result?.[0].signature).not.toBe(result?.[1].signature);
  });
});
