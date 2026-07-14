import "server-only";
import { randomBytes } from "crypto";
import { verifyMessage } from "viem";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { authNonces } from "../db/schema";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DOMAIN = "morva.app";

/** Deterministic from {address, nonce} alone — no timestamp — so the
 *  server can reconstruct the exact bytes the client signed at verify
 *  time without needing to persist the message string itself. Freshness
 *  comes from the nonce's stored expiry, not a timestamp in the message. */
export function buildSiweMessage(params: { address: string; nonce: string }): string {
  return [
    `${DOMAIN} wants you to sign in with your Ethereum account:`,
    params.address,
    "",
    "Verify wallet ownership to manage your Morva stall.",
    "",
    `Nonce: ${params.nonce}`,
  ].join("\n");
}

export async function issueNonce(address: string): Promise<{ nonce: string; message: string }> {
  const nonce = randomBytes(16).toString("hex");
  const normalized = address.toLowerCase();

  await db.insert(authNonces).values({
    nonce,
    address: normalized,
    expiresAt: new Date(Date.now() + NONCE_TTL_MS),
  });

  return { nonce, message: buildSiweMessage({ address, nonce }) };
}

/** Verifies a signed message against a previously issued nonce. The nonce
 *  is consumed (deleted) regardless of outcome, so it can never be reused
 *  — a fresh nonce is required for every sign-in attempt. */
export async function verifySiwe(params: {
  address: string;
  nonce: string;
  signature: `0x${string}`;
}): Promise<boolean> {
  const [row] = await db.select().from(authNonces).where(eq(authNonces.nonce, params.nonce)).limit(1);
  await db.delete(authNonces).where(eq(authNonces.nonce, params.nonce));

  if (!row) return false;
  if (row.address !== params.address.toLowerCase()) return false;
  if (row.expiresAt.getTime() < Date.now()) return false;

  const message = buildSiweMessage({ address: params.address, nonce: params.nonce });

  try {
    return await verifyMessage({
      address: params.address as `0x${string}`,
      message,
      signature: params.signature,
    });
  } catch {
    return false;
  }
}
