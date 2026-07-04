import type { ChainHolding } from "@/lib/types";

export function ChainBreakdown({ chains }: { chains: ChainHolding[] }) {
  return (
    <div className="flex flex-col">
      {chains.map((chain, i) => (
        <div
          key={chain.chainId}
          className={`flex items-center gap-[11px] py-2 ${i > 0 ? "border-t border-divider" : ""}`}
        >
          <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg bg-accent-slate-bg text-[12px] font-semibold text-accent-slate-fg">
            {chain.initial}
          </span>
          <span className="flex-1 text-[14px] text-ink">{chain.name}</span>
          <span className="text-[14px] font-semibold text-ink">${chain.amountUsd.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
