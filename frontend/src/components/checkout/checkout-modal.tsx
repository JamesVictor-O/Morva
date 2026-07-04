"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown, FileText, X } from "lucide-react";
import type { Product, Stall, UnifiedBalance } from "@/lib/types";
import { AvatarTile } from "../ui/avatar-tile";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { ChainBreakdown } from "./chain-breakdown";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

type Step = "review" | "processing" | "success" | "insufficient" | "failed";

const SIMULATED_SETTLE_MS = 2200;

export function CheckoutModal({
  open,
  onClose,
  stall,
  product,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  stall: Stall;
  product: Product;
  balance: UnifiedBalance;
}) {
  const covers = balance.totalUsd >= product.priceUsd;
  const [step, setStep] = useState<Step>(covers ? "review" : "insufficient");
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  function reset() {
    setStep(covers ? "review" : "insufficient");
    setBreakdownOpen(false);
  }

  function handleClose() {
    onClose();
    // Let the exit animation finish before resetting state for next open.
    setTimeout(reset, 250);
  }

  async function handlePay() {
    if (!covers) return;
    setStep("processing");
    try {
      // No live payment execution wired up yet — this is where the SDK's
      // session.pay() call goes once the frontend connects to it.
      await new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_SETTLE_MS));
      setStep("success");
    } catch {
      setStep("failed");
    }
  }

  const remaining = balance.totalUsd - product.priceUsd;
  const shortfall = product.priceUsd - balance.totalUsd;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="relative overflow-hidden rounded-[28px] border border-border-soft bg-surface-solid px-[30px] pb-[26px] pt-8">
        {step !== "success" && (
          <div className="flex items-center gap-3">
            <AvatarTile label={stall.initial} accent={stall.accent} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">{stall.name}</p>
              <p className="truncate text-[13px] text-ink-faint">{product.name}</p>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-fill transition-colors hover:bg-border-soft"
            >
              <X size={16} strokeWidth={1.8} className="text-ink-faint" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease }}
            >
              <p className="mt-[26px] text-[15px] text-ink-soft">Total</p>
              <p className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-ink">
                ${product.priceUsd.toFixed(2)}
              </p>

              <div className="mt-6 rounded-[20px] border border-border-soft p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-ink-soft">Paying from your balance</p>
                    <p className="mt-0.5 text-[19px] font-semibold text-ink">
                      ${balance.totalUsd.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setBreakdownOpen((o) => !o)}
                    className="flex flex-none items-center gap-[7px] rounded-full bg-fill px-[14px] py-2 text-[13px] text-ink-soft"
                  >
                    Held across {balance.chains.length} networks
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${breakdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
                <AnimatePresence>
                  {breakdownOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 border-t border-divider pt-1.5">
                        <ChainBreakdown chains={balance.chains} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button onClick={handlePay} fullWidth variant="primary" className="mt-[22px]">
                Pay ${product.priceUsd.toFixed(2)}
              </Button>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-whisper">
                <ShieldIcon /> Secured by Morva
              </p>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mt-[26px] text-[15px] text-ink-soft">Total</p>
              <p className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-ink">
                ${product.priceUsd.toFixed(2)}
              </p>
              <div className="mt-6 rounded-[20px] border border-border-soft p-4">
                <p className="text-[14px] text-ink-soft">Paying from your balance</p>
                <p className="mt-0.5 text-[19px] font-semibold text-ink">
                  ${balance.totalUsd.toFixed(2)}
                </p>
              </div>
              <div className="mt-[22px] rounded-full bg-fill py-[18px] text-center text-[16px] font-semibold text-ink-soft">
                Moving your funds…
              </div>
              <div className="relative mt-3 h-[3px] overflow-hidden rounded-full bg-fill">
                <div
                  className="absolute top-0 h-full w-[38%] rounded-full bg-primary"
                  style={{ animation: "morva-progress 1.1s ease-in-out infinite" }}
                />
              </div>
              <p className="mt-2.5 text-center text-[13px] text-ink-faint">
                Nothing for you to do.
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col items-center py-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg"
              >
                <CheckCircle2 size={32} className="text-success-fg" />
              </motion.div>
              <p className="mt-5 text-[24px] font-semibold tracking-tight text-ink">
                Paid ${product.priceUsd.toFixed(2)}
              </p>
              <p className="mt-1 text-[14px] text-ink-faint">
                ${remaining.toFixed(2)} left in your balance
              </p>
              <Button variant="dark" fullWidth className="mt-8">
                <FileText size={16} strokeWidth={1.8} />
                View receipt
              </Button>
              <button
                onClick={handleClose}
                className="mt-3.5 text-[14px] text-ink-faint transition-colors hover:text-ink"
              >
                Back to {stall.name}
              </button>
            </motion.div>
          )}

          {step === "insufficient" && (
            <motion.div
              key="insufficient"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease }}
            >
              <p className="mt-[26px] text-[15px] text-ink-soft">Total</p>
              <p className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-ink">
                ${product.priceUsd.toFixed(2)}
              </p>
              <div className="mt-6 rounded-[18px] bg-error-bg p-[17px]">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-error-fg">
                  <AlertTriangle size={16} strokeWidth={2} />
                  Not enough in your balance
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-error-fg-soft">
                  You&apos;re ${shortfall.toFixed(2)} short. Add funds and you&apos;ll be right
                  back here.
                </p>
              </div>
              <Button fullWidth className="mt-4">
                Add funds
              </Button>
              <button
                onClick={handleClose}
                className="mt-3 w-full text-center text-[13px] text-ink-faint transition-colors hover:text-ink"
              >
                Choose something else
              </button>
            </motion.div>
          )}

          {step === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease }}
            >
              <p className="mt-[26px] text-[15px] text-ink-soft">Total</p>
              <p className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-ink">
                ${product.priceUsd.toFixed(2)}
              </p>
              <div className="mt-6 rounded-[18px] bg-error-bg p-[17px]">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-error-fg">
                  <AlertTriangle size={16} strokeWidth={2} />
                  Payment didn&apos;t go through
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-error-fg-soft">
                  Nothing was charged. This usually clears up on a second try.
                </p>
              </div>
              <Button fullWidth className="mt-4" onClick={() => setStep("review")}>
                Try again
              </Button>
              <button className="mt-3 w-full text-center text-[13px] text-ink-faint transition-colors hover:text-ink">
                Get help
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
