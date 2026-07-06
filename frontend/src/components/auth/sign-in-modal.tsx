"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function SignInModal({
  open,
  redirectTo,
  onClose,
}: {
  open: boolean;
  redirectTo?: string;
  onClose: () => void;
}) {
  const { signIn, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      setError("Sign-in isn't configured yet — set NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Magic renders its own overlay from here (email → one-time code →
      // optional device approval); we just wait for it to resolve.
      await signIn(email.trim());
      setEmail("");
      onClose();
      if (redirectTo) router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-5 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in or sign up"
        className="w-full max-w-[400px] rounded-[28px] border border-border-soft bg-surface-solid p-8 shadow-[0_24px_70px_rgba(22,22,26,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[21px] font-semibold tracking-tight text-ink">Sign in or sign up</p>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-soft">
              Enter your email — Magic creates your wallet automatically the
              first time, no password or seed phrase needed.
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex-none rounded-full p-1.5 text-ink-faint transition-colors hover:bg-fill hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            disabled={submitting}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] text-ink outline-none transition-colors focus:border-primary disabled:opacity-60"
          />
          {error && <p className="text-[13px] leading-[1.4] text-error-fg">{error}</p>}
          <Button type="submit" disabled={submitting || !email} fullWidth>
            {submitting ? <Loader2 size={18} strokeWidth={2} className="animate-spin" /> : "Continue with email"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[12px] text-ink-quiet">
          Secured by Magic — powers the embedded wallet behind every stall.
        </p>
      </div>
    </div>
  );
}
