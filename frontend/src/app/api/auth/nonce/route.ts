import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { issueNonce } from "@/lib/auth/siwe";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "A valid address query param is required." }, { status: 400 });
  }

  const { nonce, message } = await issueNonce(address);
  return NextResponse.json({ nonce, message });
}
