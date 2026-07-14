import type { Magic } from "magic-sdk";
import { createWalletClient, custom, type Address, type Hex, type SignedAuthorization } from "viem";
import type { AuthorizationRequest, MorvaSigner } from "@morva/sdk";

/**
 * MorvaSigner backed by a Magic embedded wallet. Magic never hands the
 * buyer's private key to the app — signing happens inside Magic's iframe —
 * so unlike @morva/sdk's LocalSigner (which signs directly with a key it
 * holds), every method here delegates to Magic's own APIs:
 *  - signMessage goes through magic.rpcProvider (personal_sign), wrapped
 *    in a viem wallet client so the raw-bytes signing matches exactly what
 *    LocalSigner produces via viem's account.signMessage.
 *  - signAuthorization uses magic.wallet.sign7702Authorization(), Magic's
 *    native EIP-7702 authorization signing, then remaps its response shape
 *    into viem's SignedAuthorization.
 */
export class MagicSigner implements MorvaSigner {
  constructor(
    private readonly magic: Magic,
    public readonly address: Address
  ) {}

  async signMessage(message: Uint8Array): Promise<Hex> {
    const walletClient = createWalletClient({
      account: this.address,
      transport: custom(this.magic.rpcProvider),
    });
    return walletClient.signMessage({ account: this.address, message: { raw: message } });
  }

  async signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization> {
    const signed = await this.magic.wallet.sign7702Authorization({
      contractAddress: auth.contractAddress,
      chainId: auth.chainId,
      nonce: auth.nonce,
    });

    return {
      address: signed.contractAddress as Address,
      chainId: signed.chainId,
      nonce: signed.nonce,
      r: signed.r as Hex,
      s: signed.s as Hex,
      // Magic's `v` is documented as the recovery id (0/1) but returns it
      // under the legacy Ethereum `v` name — normalize the 27/28 form too
      // in case a future Magic version sends it, since EIP-7702's yParity
      // must be 0 or 1, not 27/28.
      yParity: signed.v >= 27 ? signed.v - 27 : signed.v,
    };
  }
}
