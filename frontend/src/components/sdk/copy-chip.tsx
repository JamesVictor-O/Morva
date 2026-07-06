"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-3 rounded-full border border-border-strong bg-ink px-6 py-3.5 font-mono text-[15px] text-white transition-colors hover:bg-[#26262b]"
    >
      {text}
      {copied ? (
        <Check size={16} strokeWidth={2.2} className="text-white" />
      ) : (
        <Copy size={16} strokeWidth={1.8} className="text-white/50" />
      )}
    </button>
  );
}
