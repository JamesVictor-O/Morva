import { serializeSignature, type SignedAuthorization } from "viem";
import type { EIP7702Authorization, ITransaction, IUserOpWithChain } from "@particle-network/universal-account-sdk";
import { MorvaSdkError } from "../errors";
import type { MorvaSigner } from "./signer";

/**
 * Signs any pending EIP-7702 authorizations a transaction's userOps
 * require, and returns them in the shape ua.sendTransaction()'s third
 * argument expects. Adapted from Particle's official reference
 * (Particle-Network/universal-accounts-7702, lib/eip7702.ts) — that
 * implementation targets Privy + ethers; this one targets a generic
 * MorvaSigner + viem's serializeSignature (produces the identical
 * compact hex signature format as ethers' `Signature.from().serialized`).
 */
export async function signPendingAuthorizations(
  transaction: ITransaction,
  signer: MorvaSigner
): Promise<EIP7702Authorization[] | undefined> {
  const authorizations: EIP7702Authorization[] = [];
  // Keyed by chainId+nonce, not nonce alone: the authorization nonce is
  // scoped per-chain, so two different chains can legitimately both be at
  // nonce 0 for the same owner. Deduping on nonce alone would let one
  // chain's signature be reused for another chain's authorization.
  const authCache = new Map<string, string>();

  for (const userOp of transaction.userOps as IUserOpWithChain[]) {
    if (!userOp.eip7702Auth || userOp.eip7702Delegated) continue;

    const cacheKey = `${userOp.eip7702Auth.chainId}:${userOp.eip7702Auth.nonce}`;
    let signature = authCache.get(cacheKey);
    if (!signature) {
      const signed = await signer.signAuthorization({
        contractAddress: userOp.eip7702Auth.address as `0x${string}`,
        chainId: userOp.eip7702Auth.chainId,
        nonce: userOp.eip7702Auth.nonce,
      });
      signature = serializeSignature({ r: signed.r, s: signed.s, yParity: resolveYParity(signed) });
      authCache.set(cacheKey, signature);
    }

    authorizations.push({ userOpHash: userOp.userOpHash, signature });
  }

  return authorizations.length > 0 ? authorizations : undefined;
}

/** viem's SignedAuthorization types `yParity`/`v` as a union of possible
 *  signature shapes, so neither is guaranteed present on its own — this
 *  resolves whichever the signer actually returned into the yParity
 *  serializeSignature() requires. */
function resolveYParity(signed: SignedAuthorization): number {
  if (signed.yParity !== undefined) return signed.yParity;
  if (signed.v !== undefined) return Number(signed.v % 2n);
  throw new MorvaSdkError("Authorization signature is missing both yParity and v — cannot serialize");
}
