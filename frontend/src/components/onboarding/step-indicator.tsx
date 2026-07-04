export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === step ? "w-[26px] bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-border-strong"
          }`}
        />
      ))}
      <span className="ml-2 text-[13px] text-ink-faint">
        Step {step + 1} of {total}
      </span>
    </div>
  );
}
