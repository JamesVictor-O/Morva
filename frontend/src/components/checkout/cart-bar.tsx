"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";

/** Floating summary bar that appears once the current stall's cart has
 *  anything in it, and is the only way into the checkout page. */
export function CartBar({ stallSlug }: { stallSlug: string }) {
  const { stallSlug: cartStallSlug, itemCount, totalUsd } = useCart();
  const visible = cartStallSlug === stallSlug && itemCount > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-5"
        >
          <Link
            href={`/stalls/${stallSlug}/checkout`}
            className="flex items-center gap-4 rounded-full border border-border-soft bg-ink px-3 py-3 pl-5 text-white shadow-[0_16px_50px_rgba(22,22,26,0.25)]"
          >
            <ShoppingBag size={18} strokeWidth={1.8} />
            <span className="text-[14px] font-medium text-white/70">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink">
              Checkout · ${totalUsd.toFixed(2)}
              <ArrowRight size={15} strokeWidth={2} />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
