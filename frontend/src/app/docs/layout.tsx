import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

const GITHUB_URL = "https://github.com/JamesVictor-O/Morva";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg">
      <header className="sticky top-0 z-30 border-b border-border-soft bg-app-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-[16px] font-semibold tracking-tight text-ink">Morva</span>
            <span className="rounded-full bg-fill px-2.5 py-0.5 font-mono text-[11px] text-ink-faint">docs</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/demo" className="text-[14px] text-ink-soft transition-colors hover:text-ink">
              Demo
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
            >
              GitHub
              <ExternalLink size={13} strokeWidth={1.8} />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] items-start gap-12 px-5 py-10 sm:px-8">
        <aside className="sticky top-[73px] hidden w-[220px] flex-none py-2 lg:block">
          <DocsSidebar />
        </aside>
        <main className="min-w-0 flex-1 pb-24">{children}</main>
      </div>
    </div>
  );
}
