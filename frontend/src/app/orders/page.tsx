"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { BalancePill } from "@/components/checkout/balance-pill";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { StatusPill } from "@/components/ui/status-pill";
import { ORDERS, UNIFIED_BALANCE, getStallById } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";

type Filter = "all" | OrderStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "delivered", label: "Delivered" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  "in-progress": "On the way",
  delivered: "Delivered",
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const matches = (order: Order) => filter === "all" || order.status === filter;
  const thisWeek = ORDERS.filter((o) => o.period === "this-week" && matches(o));
  const earlier = ORDERS.filter((o) => o.period === "earlier" && matches(o));

  return (
    <AppShell variant="buyer">
      <Topbar
        left={<p className="text-[32px] font-semibold tracking-tight text-ink sm:text-[38px]">Your orders</p>}
        right={
          <>
            <BalancePill balance={UNIFIED_BALANCE} />
            <AvatarTile label="AR" accent="purple" size="lg" className="rounded-full" />
          </>
        }
      />

      <main className="px-5 py-8 sm:px-8 lg:px-[34px] lg:py-10">
        <div className="flex flex-wrap gap-2.5">
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

        <OrderGroup label="This week" orders={thisWeek} />
        <OrderGroup label="Earlier" orders={earlier} />

        {thisWeek.length === 0 && earlier.length === 0 && (
          <p className="mt-10 text-[15px] text-ink-faint">No orders match this filter.</p>
        )}
      </main>
    </AppShell>
  );
}

function OrderGroup({ label, orders }: { label: string; orders: Order[] }) {
  if (orders.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="mb-3 text-[14px] text-ink-faint">{label}</p>
      <div className="rounded-[26px] border border-border-soft bg-surface-solid px-6">
        {orders.map((order, i) => (
          <OrderRow key={order.id} order={order} withDivider={i > 0} />
        ))}
      </div>
    </div>
  );
}

function OrderRow({ order, withDivider }: { order: Order; withDivider: boolean }) {
  const stall = getStallById(order.stallId);
  if (!stall) return null;

  return (
    <div className={`flex flex-wrap items-center gap-4 py-4 ${withDivider ? "border-t border-divider" : ""}`}>
      <AvatarTile label={stall.initial} accent={stall.accent} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold text-ink">{order.productName}</p>
        <p className="truncate text-[14px] text-ink-faint">
          {stall.name} · {order.date}
        </p>
      </div>
      <StatusPill tone={order.status === "delivered" ? "success" : "warning"}>
        {STATUS_LABEL[order.status]}
      </StatusPill>
      <p className="flex-none text-[16px] font-semibold text-ink">${order.amountUsd.toFixed(2)}</p>
      <span className="flex-none text-[14px] text-ink-faint">Receipt</span>
    </div>
  );
}
