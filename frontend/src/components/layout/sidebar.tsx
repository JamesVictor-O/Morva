"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BUYER_NAV, MERCHANT_NAV } from "./nav-config";

export function Sidebar({
  variant,
  cta,
  className = "",
}: {
  variant: "buyer" | "merchant";
  cta?: { title: string; body: string; actionLabel: string; href: string };
  className?: string;
}) {
  const pathname = usePathname();
  const items = variant === "buyer" ? BUYER_NAV : MERCHANT_NAV;

  return (
    <aside
      className={`flex w-[236px] flex-none flex-col gap-9 border-r border-border-soft p-5 ${className}`}
    >
      <Link href="/" className="flex items-center gap-[11px] px-1.5">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-ink text-[16px] font-semibold text-white">
          M
        </div>
        <span className="text-[20px] font-semibold tracking-tight text-ink">Morva</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const content = (
            <span
              className={`flex items-center gap-[13px] rounded-full px-4 py-3 text-[15px] font-medium transition-colors ${
                active ? "bg-primary text-primary-ink font-semibold" : "text-ink-soft"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              {item.label}
            </span>
          );
          return active || item.enabled ? (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.href} className="cursor-default opacity-70">
              {content}
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {cta && (
        <div className="rounded-[20px] border border-border-soft p-[18px]">
          <p className="text-[14px] font-semibold text-ink">{cta.title}</p>
          <p className="mt-[5px] text-[13px] leading-[1.45] text-ink-faint">{cta.body}</p>
          <Link
            href={cta.href}
            className="mt-[13px] flex items-center gap-1.5 text-[14px] font-semibold text-ink"
          >
            {cta.actionLabel}
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </aside>
  );
}
