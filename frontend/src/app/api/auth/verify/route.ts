import { NextRequest, NextResponse } from "next/server";
import { isAddress, isHex } from "viem";
import { verifySiwe } from "@/lib/auth/siwe";
import { createMerchantSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { address?: string; nonce?: string; signature?: string }
    | null;

  if (!body || !body.address || !body.nonce || !body.signature) {
    return NextResponse.json({ error: "address, nonce, and signature are required." }, { status: 400 });
  }
  if (!isAddress(body.address) || !isHex(body.signature)) {
    return NextResponse.json({ error: "Malformed address or signature." }, { status: 400 });
  }

  const verified = await verifySiwe({
    address: body.address,
    nonce: body.nonce,
    signature: body.signature,
  });

  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
  }

  await createMerchantSession(body.address);
  return NextResponse.json({ ok: true });
}
