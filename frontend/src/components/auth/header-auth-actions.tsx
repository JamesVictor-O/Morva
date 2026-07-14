"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Replaces the "Enter the Plaza" CTA once signed in — that CTA already
 *  lives in the hero. One grouped pill: the avatar (click to sign out) sits
 *  with the wallet address (click to copy) as a single connected-wallet
 *  unit, rather than two separate controls scattered across the header. */
function WalletStatus({ email, address, onSignOut }: { email: string | null; address: string; onSignOut: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied — not worth surfacing an error for.
    }
  }

  return (
    <div className="hidden items-center gap-2 rounded-full bg-fill py-1 pl-1 pr-3.5 sm:flex">
      <button
        onClick={onSignOut}
        title={email ? `Signed in as ${email} — click to sign out` : "Sign out"}
        className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-purple-bg text-[13px] font-semibold text-accent-purple-fg transition-opacity hover:opacity-80"
      >
        {(email ?? "?").charAt(0).toUpperCase()}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy wallet address"
        className="flex items-center gap-1.5 font-mono text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        {truncateAddress(address)}
        {copied ? (
          <Check size={13} strokeWidth={2.2} className="text-success-fg" />
        ) : (
          <Copy size={13} strokeWidth={1.8} className="text-ink-faint" />
        )}
      </button>
    </div>
  );
}

/** The header's right-hand slot: sign-in prompts when logged out, the real
 *  app entry points once a visitor has actually signed in. */
export function HeaderAuthActions() {
  const { status, user, requestSignIn, signOut } = useAuth();

  if (status === "loading") {
    return <div className="h-[42px] w-[168px] animate-pulse rounded-full bg-fill" />;
  }

  if (status !== "authenticated") {
    return (
      <>
        <button
          onClick={() => requestSignIn()}
          className="hidden text-[15px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
        >
          Sign in
        </button>
        <Button variant="dark" className="px-5 py-2.5 text-[14px]" onClick={() => requestSignIn()}>
          Sign up
        </Button>
      </>
    );
  }

  return (
    <>
      {user?.publicAddress && (
        <WalletStatus email={user.email} address={user.publicAddress} onSignOut={signOut} />
      )}
    </>
  );
}
