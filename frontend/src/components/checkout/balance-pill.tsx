"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { UnifiedBalance } from "@/lib/types";
import { ChainBreakdown } from "./chain-breakdown";

export function BalancePill({ balance }: { balance: UnifiedBalance }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-surface-solid px-4 py-2.5 transition-colors hover:bg-fill"
      >
        <span className="hidden text-[13px] text-ink-faint sm:inline">Your balance</span>
        <span className="text-[15px] font-semibold text-ink">${balance.totalUsd.toFixed(2)}</span>
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
              <p className="text-[13px] text-ink-faint">Your balance</p>
              <p className="mt-0.5 text-[30px] font-semibold tracking-tight text-ink">
                ${balance.totalUsd.toFixed(2)}
              </p>
              <p className="mb-1 mt-3 text-[13px] text-ink-faint">
                Held across {balance.chains.length} networks
              </p>
              <ChainBreakdown chains={balance.chains} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
