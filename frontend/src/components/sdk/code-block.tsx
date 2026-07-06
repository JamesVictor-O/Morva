export function CodeBlock({ code, className = "" }: { code: string; className?: string }) {
  return (
    <pre
      className={`overflow-x-auto rounded-[22px] border border-[#26262b] bg-ink p-6 font-mono text-[13.5px] leading-[1.7] text-white/90 sm:p-7 sm:text-[14px] ${className}`}
    >
      <code>{code}</code>
    </pre>
  );
}
