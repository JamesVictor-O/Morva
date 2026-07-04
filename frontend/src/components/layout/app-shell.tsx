"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { BUYER_NAV, MERCHANT_NAV } from "./nav-config";

export function AppShell({
  variant,
  cta,
  children,
}: {
  variant: "buyer" | "merchant";
  cta?: { title: string; body: string; actionLabel: string; href: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const navItems = variant === "buyer" ? BUYER_NAV : MERCHANT_NAV;

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <div className="flex items-center justify-between border-b border-border-soft px-5 py-4 lg:hidden">
        <Link href="/" className="flex items-center gap-[10px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[14px] font-semibold text-white">
            M
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-ink">Morva</span>
        </Link>
        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-b border-border-soft px-5 py-4 lg:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const content = (
              <span
                className={`flex items-center gap-3 rounded-full px-4 py-3 text-[15px] font-medium ${
                  active ? "bg-primary text-primary-ink font-semibold" : "text-ink-soft"
                }`}
              >
                <Icon size={19} strokeWidth={1.5} />
                {item.label}
              </span>
            );
            return active || item.enabled ? (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                {content}
              </Link>
            ) : (
              <div key={item.href} className="cursor-default opacity-70">
                {content}
              </div>
            );
          })}
        </nav>
      )}

      <Sidebar variant={variant} cta={cta} className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
