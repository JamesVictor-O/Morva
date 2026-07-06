"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ChainBreakdown } from "./chain-breakdown";

/** Reads live from the buyer's Particle Universal Account via AuthContext —
 *  no `balance` prop, so every caller always shows the same real number. */
export function BalancePill() {
  const [open, setOpen] = useState(false);
  const { balance, balanceStatus, refreshBalance } = useAuth();

  const loading = balanceStatus === "loading" || balanceStatus === "idle";
  const totalLabel = loading ? "…" : balance ? `$${balance.totalUsd.toFixed(2)}` : "—";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-surface-solid px-4 py-2.5 transition-colors hover:bg-fill"
      >
        <span className="hidden text-[13px] text-ink-faint sm:inline">Your balance</span>
        <span className={`text-[15px] font-semibold text-ink ${loading ? "animate-pulse" : ""}`}>
          {totalLabel}
        </span>
        <ChevronDown
          size={15}
          className={`text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-[calc(100%+10px)] z-30 w-[300px] rounded-[22px] border border-border bg-surface-solid p-5 shadow-[0_16px_50px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink-faint">Your balance</p>
                <button
                  onClick={() => refreshBalance()}
                  aria-label="Refresh balance"
                  className="rounded-full p-1 text-ink-faint transition-colors hover:bg-fill hover:text-ink"
                >
                  <RefreshCw size={13} className={balanceStatus === "loading" ? "animate-spin" : ""} />
                </button>
              </div>

              {balanceStatus === "error" ? (
                <>
                  <p className="mt-0.5 text-[16px] font-semibold text-ink">Balance unavailable</p>
                  <p className="mt-1 text-[13px] leading-[1.4] text-ink-faint">
                    Couldn&apos;t reach your Universal Account. Try refreshing.
                  </p>
                </>
              ) : (
                <>
                  <p className={`mt-0.5 text-[30px] font-semibold tracking-tight text-ink ${loading ? "animate-pulse" : ""}`}>
                    {totalLabel}
                  </p>
                  <p className="mb-1 mt-3 text-[13px] text-ink-faint">
                    {balance ? `Held across ${balance.chains.length} networks` : "Fetching your chains…"}
                  </p>
                  {balance && <ChainBreakdown chains={balance.chains} />}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
