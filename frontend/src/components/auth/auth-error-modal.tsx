"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Sign-in itself happens entirely inside Magic's own hosted UI
 * (`magic.wallet.connectWithUI()`) — this only surfaces the cases Magic's
 * overlay can't: the publishable key missing, or the SDK call itself
 * failing before Magic's iframe ever opens. A user closing Magic's overlay
 * is not an error and never reaches this.
 */
export function AuthErrorModal({
  message,
  onRetry,
  onClose,
}: {
  message: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(message)} onClose={onClose}>
      <div
        role="alertdialog"
        aria-label="Sign-in error"
        className="w-full max-w-[400px] rounded-[28px] border border-border-soft bg-surface-solid p-8 shadow-[0_24px_70px_rgba(22,22,26,0.18)]"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[21px] font-semibold tracking-tight text-ink">Couldn&apos;t sign you in</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-none rounded-full p-1.5 text-ink-faint transition-colors hover:bg-fill hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-[14px] leading-[1.5] text-ink-soft">{message}</p>
        <Button className="mt-6" fullWidth onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Modal>
  );
}
