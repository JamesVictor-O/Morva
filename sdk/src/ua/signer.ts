import { type Address, type Hex, type PrivateKeyAccount, type SignedAuthorization } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface AuthorizationRequest {
  contractAddress: Address;
  chainId: number;
  nonce: number;
}

/** The buyer-side signing capability the SDK needs. Browser wallets
 *  (Magic, injected wallets, etc.) implement this in the frontend —
 *  LocalSigner below is the raw-private-key implementation used for
 *  scripts and tests. */
export interface MorvaSigner {
  address: Address;
  signMessage(message: Uint8Array): Promise<Hex>;
  signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization>;
}

/**
 * MorvaSigner backed by a raw private key, via viem's native EIP-7702
 * authorization signing. Intended for scripts/e2e-payment.ts and tests —
 * browser signers (Magic, wallet extensions) are the frontend's job.
 *
 * NOTE: the task brief called for this to be backed by an ethers v6
 * Wallet. viem's PrivateKeyAccount already implements real EIP-7702
 * authorization signing (signAuthorization) and personal_sign
 * (signMessage) natively, producing the same signature format
 * authorization.ts's serializeSignature() expects — so pulling in ethers
 * as a second signing library for this one class would be pure
 * duplication, not a functional need. viem is already a required
 * dependency for the registry client, so this keeps the dependency
 * surface to viem + the Particle SDK only.
 */
export class LocalSigner implements MorvaSigner {
  private readonly account: PrivateKeyAccount;

  constructor(privateKey: Hex) {
    this.account = privateKeyToAccount(privateKey);
  }

  get address(): Address {
    return this.account.address;
  }

  async signMessage(message: Uint8Array): Promise<Hex> {
    return this.account.signMessage({ message: { raw: message } });
  }

  async signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization> {
    return this.account.signAuthorization(auth);
  }
}
