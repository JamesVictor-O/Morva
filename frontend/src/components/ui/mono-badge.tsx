type Tone = "neutral" | "success" | "error";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-fill text-ink-soft",
  success: "bg-success-bg text-success-fg",
  error: "bg-error-bg text-error-fg",
};

export function MonoBadge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 font-mono text-[12px] font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-quiet">
      {children}
    </p>
  );
}
