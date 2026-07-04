type Tone = "success" | "warning" | "error" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-accent-yellow-bg text-accent-yellow-fg",
  error: "bg-error-bg text-error-fg",
  neutral: "bg-fill text-ink-quiet",
};

export function StatusPill({
  tone,
  children,
  className = "",
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex flex-none items-center rounded-full px-[13px] py-1.5 text-[12px] font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
