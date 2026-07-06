"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Binds directly to cart quantity — 0 shows "Add to cart"; any positive
 *  quantity shows a live −/+ stepper, no separate "confirm" step. */
export function QuantityStepper({
  quantity,
  onChange,
  className = "",
}: {
  quantity: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  if (quantity <= 0) {
    return (
      <Button onClick={() => onChange(1)} className={`px-[22px] py-[11px] text-[15px] ${className}`}>
        Add to cart
      </Button>
    );
  }

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
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-fill"
      >
        <Plus size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
