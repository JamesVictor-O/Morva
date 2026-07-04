/**
 * Gate 2 — the script that decides everything.
 *
 * Pays ~1 USDC to a merchant recipient on Arbitrum One, from a buyer EOA
 * whose funds live on OTHER chains, using the real Particle Universal
 * Account (EIP-7702 mode) and real mainnet funds. No registry involved —
 * createDirectIntent() is used specifically so this can prove the
 * payment path works before the registry contract is deployed.
 *
 * Run with: pnpm e2e
 *
 * Required env (.env in sdk/, see .env.example):
 *   PARTICLE_PROJECT_ID
 *   PARTICLE_CLIENT_KEY
 *   PARTICLE_APP_UUID
 *   BUYER_PRIVATE_KEY     — funded with a small amount of value on a
 *                           non-Arbitrum chain (e.g. USDC on Base)
 *   MERCHANT_RECIPIENT    — any address; this script just checks its
 *                           USDC balance on Arbitrum One before/after
 */
import "dotenv/config";
import { createPublicClient, erc20Abi, formatUnits, http, type Address, type Hex } from "viem";
import { arbitrum } from "viem/chains";
import { createMorva, LocalSigner, type PaymentStatus } from "../src/index.js";

const USDC_ARBITRUM: Address = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const PAYMENT_AMOUNT = "1.00";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function readUsdcBalance(publicClient: ReturnType<typeof createPublicClient>, address: Address) {
  return publicClient.readContract({
    address: USDC_ARBITRUM,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  }) as Promise<bigint>;
}

async function main() {
  const projectId = requireEnv("PARTICLE_PROJECT_ID");
  const projectClientKey = requireEnv("PARTICLE_CLIENT_KEY");
  const projectAppUuid = requireEnv("PARTICLE_APP_UUID");
  const buyerPrivateKey = requireEnv("BUYER_PRIVATE_KEY") as Hex;
  const merchantRecipient = requireEnv("MERCHANT_RECIPIENT") as Address;

  const morva = createMorva({ particle: { projectId, projectClientKey, projectAppUuid } });
  const signer = new LocalSigner(buyerPrivateKey);
  console.log(`Buyer address (EIP-7702 owner, in place): ${signer.address}`);

  const publicClient = createPublicClient({ chain: arbitrum, transport: http() });

  const balanceBefore = await readUsdcBalance(publicClient, merchantRecipient);
  console.log(`Recipient USDC balance on Arbitrum before: ${formatUnits(balanceBefore, 6)}`);

  const session = await morva.connect(signer);

  const balance = await session.getUnifiedBalance();
  console.log(`\nBuyer unified balance: $${balance.totalUsd}`);
  for (const asset of balance.assets) {
    console.log(`  ${asset.symbol}: ${asset.totalAmount} ($${asset.usdValue})`);
    for (const chain of asset.chains) {
      console.log(`    chain ${chain.chainId}: ${chain.amount}`);
    }
  }

  const intent = morva.createDirectIntent({
    amount: PAYMENT_AMOUNT,
    orderId: `e2e-${Date.now()}`,
    settlementToken: USDC_ARBITRUM,
    settlementRecipient: merchantRecipient,
  });

  console.log(`\nPaying ${PAYMENT_AMOUNT} USDC to ${merchantRecipient} on Arbitrum One...`);
  const result = await session.pay(intent, {
    onStatus: (status: PaymentStatus) => console.log(`  status: ${status}`),
  });

  console.log(`\nTransaction ID: ${result.transactionId}`);
  console.log(`Explorer: ${result.explorerUrl}`);

  const balanceAfter = await readUsdcBalance(publicClient, merchantRecipient);
  console.log(`\nRecipient USDC balance on Arbitrum after: ${formatUnits(balanceAfter, 6)}`);
  console.log(`Delta: +${formatUnits(balanceAfter - balanceBefore, 6)} USDC`);
}

main().catch((err) => {
  console.error("\nGate 2 e2e payment FAILED:");
  console.error(err);
  process.exitCode = 1;
});
