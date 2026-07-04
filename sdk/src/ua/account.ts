import type { Address } from "viem";
import { UNIVERSAL_ACCOUNT_VERSION, UniversalAccount } from "@particle-network/universal-account-sdk";
import { DEFAULT_SLIPPAGE_BPS, type MorvaConfig } from "../config";

/** Always constructs the UA in EIP-7702 mode — the owner EOA becomes the
 *  Universal Account in place, at the same address. No ERC-4337-default
 *  (separate counterfactual smart account address) path exists in this SDK. */
export function createUniversalAccount(config: MorvaConfig, ownerAddress: Address): UniversalAccount {
  return new UniversalAccount({
    projectId: config.particle.projectId,
    projectClientKey: config.particle.projectClientKey,
    projectAppUuid: config.particle.projectAppUuid,
    smartAccountOptions: {
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress,
      useEIP7702: true,
    },
    tradeConfig: {
      slippageBps: config.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    },
    rpcUrl: config.rpcUrl,
  });
}
