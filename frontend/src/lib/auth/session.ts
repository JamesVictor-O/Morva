import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "morva_merchant_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createMerchantSession(address: string): Promise<void> {
  const token = await new SignJWT({ address: address.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearMerchantSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Cached per-request (React's cache()) — every Server Component/Action in
 *  the same request shares one verification instead of re-parsing the JWT
 *  each time. Returns null for anyone without a valid session, including
 *  buyers who are only Magic-authenticated and never went through SIWE. */
export const getMerchantSession = cache(async (): Promise<{ address: string } | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.address === "string" ? { address: payload.address } : null;
  } catch {
    return null;
  }
});

/** Throws for any Server Action / DAL read that requires a verified
 *  merchant — callers should let this propagate as an action error rather
 *  than catching it, per Next's data-security guidance to fail loudly on
 *  missing auth rather than silently returning empty data. */
export async function requireMerchantSession(): Promise<{ address: string }> {
  const session = await getMerchantSession();
  if (!session) throw new Error("Not signed in as a merchant — verify your wallet first.");
  return session;
}
