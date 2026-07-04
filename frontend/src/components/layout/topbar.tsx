export function Topbar({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-border-soft px-5 py-4 lg:px-[34px] lg:py-0 lg:h-[82px]">
      <div className="flex min-w-0 flex-1 items-center gap-4">{left}</div>
      {right && <div className="flex flex-none items-center gap-3">{right}</div>}
    </header>
  );
}
