"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Binds directly to cart quantity — 0 shows "Add to cart"; any positive
 *  quantity shows a live −/+ stepper, no separate "confirm" step.
 *  `max` (available stock) caps the "+" button and, at 0, replaces "Add
 *  to cart" with a disabled "Out of stock" state — the UI-level half of
 *  keeping an out-of-stock product from looking purchasable; the actual
 *  enforcement is the server-side check in createPendingOrder. */
export function QuantityStepper({
  quantity,
  onChange,
  max,
  className = "",
}: {
  quantity: number;
  onChange: (next: number) => void;
  max?: number;
  className?: string;
}) {
  const outOfStock = max !== undefined && max <= 0;

  if (outOfStock) {
    return (
      <Button
        disabled
        className={`cursor-not-allowed bg-fill px-[22px] py-[11px] text-[15px] text-ink-quiet hover:bg-fill ${className}`}
      >
        Out of stock
      </Button>
    );
  }

  if (quantity <= 0) {
    return (
      <Button onClick={() => onChange(1)} className={`px-[22px] py-[11px] text-[15px] ${className}`}>
        Add to cart
      </Button>
    );
  }

  const atMax = max !== undefined && quantity >= max;

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border bg-surface-solid p-1 ${className}`}
    >
      <button
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-fill"
      >
        <Minus size={15} strokeWidth={2} />
      </button>
      <span className="w-6 text-center text-[15px] font-semibold text-ink">{quantity}</span>
      <button
        onClick={() => onChange(quantity + 1)}
        disabled={atMax}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-fill disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
