"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getMagic } from "@/lib/magic";
import { MagicSigner } from "@/lib/magic-signer";
import { SignInGate } from "./sign-in-gate";

/**
 * Renders in place of any merchant page's content when there's no verified
 * wallet-ownership session yet — the server-side check (getMerchantSession())
 * decides whether this needs to render at all; the page itself does that,
 * this component only handles getting from "no session" to "session set".
 *
 * Magic sign-in alone isn't enough here: it proves *a* browser session, not
 * that this specific request is authorized to act as the stall owner. This
 * runs one extra step — sign a one-time message, verify it server-side,
 * get an httpOnly session cookie — before any merchant action is trusted.
 */
export function MerchantSessionGate() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 size={26} strokeWidth={1.8} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  if (status !== "authenticated" || !user?.publicAddress) {
    return <SignInGate title="Sign in to manage your stall" body="You'll need an account to access seller tools." />;
  }

  const address = user.publicAddress;

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    try {
      const magic = getMagic();
      if (!magic) throw new Error("Sign-in isn't configured.");

      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
      if (!nonceRes.ok) throw new Error("Could not start wallet verification.");
      const { nonce, message } = (await nonceRes.json()) as { nonce: string; message: string };

      const signer = new MagicSigner(magic, address as `0x${string}`);
      const signature = await signer.signMessage(new TextEncoder().encode(message));

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, nonce, signature }),
      });
      if (!verifyRes.ok) throw new Error("Signature verification failed. Try again.");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
        <ShieldCheck size={22} strokeWidth={1.8} />
      </div>
      <p className="mt-5 text-[24px] font-semibold tracking-tight text-ink">Verify you own this wallet</p>
      <p className="mt-2 max-w-[380px] text-[15px] leading-[1.5] text-ink-soft">
        One signature — no transaction, no gas — confirms you&apos;re the one managing this stall.
      </p>
      <Button className="mt-6 px-7 py-3.5" onClick={handleVerify} disabled={verifying}>
        {verifying ? "Waiting for your signature…" : "Verify wallet"}
      </Button>
      {error && <p className="mt-4 text-[13px] text-error-fg">{error}</p>}
    </div>
  );
}
