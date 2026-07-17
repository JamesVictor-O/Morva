/** Shared typography primitives for docs content — plain Tailwind utility
 *  classes matching the rest of the app's hand-built design system (this
 *  app doesn't use the Tailwind typography plugin anywhere else, so docs
 *  content follows the same explicit-classes convention instead of
 *  introducing a new styling approach just for this section). */

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[42px]">
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-[640px] text-[17px] leading-[1.6] text-ink-soft">{children}</p>;
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-24 text-[24px] font-semibold tracking-tight text-ink sm:text-[26px]">
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mt-9 scroll-mt-24 text-[18px] font-semibold tracking-tight text-ink">
      {children}
    </h3>
  );
}

export function P({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-4 max-w-[680px] scroll-mt-24 text-[15.5px] leading-[1.7] text-ink-soft">
      {children}
    </p>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-4 flex max-w-[680px] flex-col gap-2.5 text-[15.5px] leading-[1.6] text-ink-soft">{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[9px] h-1 w-1 flex-none rounded-full bg-ink-quiet" />
      <span>{children}</span>
    </li>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="mt-4 flex max-w-[680px] flex-col gap-3 text-[15.5px] leading-[1.6] text-ink-soft">{children}</ol>;
}

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ink font-mono text-[12.5px] font-medium text-white">
        {n}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <div className="mt-1.5 [&>p]:mt-0 [&>p]:max-w-none">{children}</div>
      </div>
    </li>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-fill px-1.5 py-0.5 font-mono text-[13.5px] text-ink">{children}</code>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === "warning" ? "border-accent-yellow-bg bg-accent-yellow-bg/40" : "border-border-soft bg-fill";
  return (
    <div className={`mt-6 max-w-[680px] rounded-2xl border p-5 ${toneClasses}`}>
      <p className="text-[13.5px] font-semibold text-ink">{title}</p>
      <div className="mt-1.5 text-[14px] leading-[1.6] text-ink-soft [&>p]:mt-0 [&>p]:max-w-none">{children}</div>
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-border-soft">
      <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-border-soft bg-fill">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i > 0 ? "border-t border-border-soft" : ""}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-ink-soft">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
