"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAV } from "@/lib/docs-nav";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7">
      {DOCS_NAV.map((group) => (
        <div key={group.section}>
          <p className="px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-quiet">{group.section}</p>
          <div className="mt-2 flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-[14px] transition-colors ${
                    active ? "bg-fill font-semibold text-ink" : "text-ink-soft hover:bg-fill hover:text-ink"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
