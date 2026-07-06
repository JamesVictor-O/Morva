"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

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
      <Link
        href="/merchant/onboarding"
        className="hidden text-[15px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
      >
        Open your stall
      </Link>
      <button
        onClick={signOut}
        title={user?.email ? `Signed in as ${user.email} — click to sign out` : "Sign out"}
        className="hidden h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-purple-bg text-[13px] font-semibold text-accent-purple-fg transition-opacity hover:opacity-80 sm:flex"
      >
        {(user?.email ?? "?").charAt(0).toUpperCase()}
      </button>
      <Link href="/plaza">
        <Button variant="dark" className="px-5 py-2.5 text-[14px]">
          Enter the Plaza
        </Button>
      </Link>
    </>
  );
}
