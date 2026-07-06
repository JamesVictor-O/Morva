"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

/**
 * Renders in place of a protected page's content while auth is unresolved
 * or the visitor isn't signed in. Reactive to `status` from AuthContext, so
 * the moment the sign-in modal resolves, this unmounts and the real page
 * appears in its place — no redirect needed.
 */
export function SignInGate({
  title = "Sign in to continue",
  body = "You'll need an account to see this page.",
}: {
  title?: string;
  body?: string;
}) {
  const { status, requestSignIn } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 size={26} strokeWidth={1.8} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-[19px] font-semibold text-white">
        M
      </div>
      <p className="mt-5 text-[24px] font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-2 max-w-[360px] text-[15px] leading-[1.5] text-ink-soft">{body}</p>
      <Button className="mt-6 px-7 py-3.5" onClick={() => requestSignIn()}>
        Sign in or sign up
      </Button>
      <Link
        href="/"
        className="mt-5 flex items-center gap-1.5 text-[14px] text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.8} />
        Back home
      </Link>
    </div>
  );
}
