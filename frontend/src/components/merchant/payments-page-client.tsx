"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { StatusPill } from "@/components/ui/status-pill";
import { formatUsd } from "@/lib/format";
import type { MerchantPayment } from "@/lib/data/orders";
import type { Accent, PaymentStatus } from "@/lib/types";

type Filter = "all" | PaymentStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "settled", label: "Settled" },
  { id: "pending", label: "Clearing" },
];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  settled: "Settled",
  pending: "Clearing",
};

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function PaymentsPageClient({
  payments,
  weeklyStats,
  stallInitial,
  stallAccent,
  payoutAddress,
  payoutToken,
}: {
  payments: MerchantPayment[];
  weeklyStats: { weekUsd: number; salesThisWeek: number };
  stallInitial: string;
  stallAccent: Accent;
  payoutAddress: string;
  payoutToken: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const settled = payments.filter((p) => p.status === "settled");
  const clearing = payments.filter((p) => p.status === "pending");
  const settledTodayUsd = settled.reduce((sum, p) => sum + p.amountUsd, 0);
  const settlingNowUsd = clearing.reduce((sum, p) => sum + p.amountUsd, 0);

  const filtered = payments.filter((p) => filter === "all" || p.status === filter);

  return (
    <AppShell variant="merchant">
      <Topbar
        left={<p className="text-[20px] font-semibold text-ink">Payments</p>}
        right={<AvatarTile label={stallInitial} accent={stallAccent} size="lg" className="rounded-full" />}
      />

      <main className="px-5 py-8 sm:px-8 lg:px-[34px] lg:py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Settled" value={`$${formatUsd(settledTodayUsd)}`}>
            Across {settled.length} sales
          </StatCard>
          <StatCard label="This week" value={`$${formatUsd(weeklyStats.weekUsd)}`}>
            {weeklyStats.salesThisWeek} sales
          </StatCard>
          <StatCard label="Settling now" value={`$${formatUsd(settlingNowUsd)}`}>
            {clearing.length > 0 ? (
              <span className="text-accent-yellow-fg">
                {clearing.length} payment{clearing.length === 1 ? "" : "s"} clearing
              </span>
            ) : (
              "All caught up"
            )}
          </StatCard>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-[24px] border border-border-soft bg-surface-solid p-5">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-accent-slate-bg text-[16px] font-semibold text-primary">
            $
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-ink">
              Settling to {truncateAddress(payoutAddress)}
            </p>
            <p className="truncate text-[13px] text-ink-faint">
              {payoutToken} · automatically, the moment each sale clears
            </p>
          </div>
          <span className="flex-none cursor-default text-[14px] font-semibold text-ink-faint">Edit</span>
        </div>

        <div className="mt-7 flex flex-wrap gap-2.5">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-5 py-2.5 text-[14px] transition-colors ${
                  active
                    ? "bg-ink font-semibold text-white"
                    : "border border-border bg-surface-solid text-ink-soft"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[26px] border border-border-soft bg-surface-solid">
          <div className="hidden gap-4 px-6 pt-5 text-[13px] text-ink-faint sm:flex">
            <span className="w-9 flex-none" />
            <span className="flex-1">Buyer &amp; item</span>
            <span className="w-[140px] flex-none">Settled to</span>
            <span className="w-[90px] flex-none text-right">Amount</span>
            <span className="w-[90px] flex-none" />
          </div>
          <div className="px-6">
            {filtered.map((payment, i) => (
              <PaymentRow key={payment.id} payment={payment} withDivider={i > 0} />
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-[15px] text-ink-faint">
                No payments match this filter.
              </p>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-border-soft bg-surface-solid p-6">
      <p className="text-[14px] text-ink-faint">{label}</p>
      <p className="mt-1 text-[32px] font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-[13px] text-ink-faint">{children}</p>
    </div>
  );
}

function PaymentRow({ payment, withDivider }: { payment: MerchantPayment; withDivider: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 py-4 ${withDivider ? "border-t border-divider" : ""}`}>
      <AvatarTile label={payment.buyerInitials} accent={payment.accent} size="md" />
      <div className="min-w-[160px] flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{payment.itemName}</p>
        <p className="truncate font-mono text-[13px] text-ink-faint">
          {payment.buyerAddress} · {payment.time}
        </p>
      </div>
      <p className="w-full font-mono text-[13px] text-ink-faint sm:w-[140px]">
        {payment.settledToAddress ? truncateAddress(payment.settledToAddress) : "— pending —"}
      </p>
      <p className="w-[90px] flex-none text-right text-[16px] font-semibold text-ink">
        ${formatUsd(payment.amountUsd)}
      </p>
      <div className="w-[90px] flex-none text-right">
        <StatusPill tone={payment.status === "settled" ? "success" : "warning"}>
          {STATUS_LABEL[payment.status]}
        </StatusPill>
      </div>
    </div>
  );
}
