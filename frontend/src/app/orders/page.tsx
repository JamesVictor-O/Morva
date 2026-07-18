"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { BalancePill } from "@/components/checkout/balance-pill";
import { UserAvatar } from "@/components/auth/user-avatar";
import { SignInGate } from "@/components/auth/sign-in-gate";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { StatusPill } from "@/components/ui/status-pill";
import { useAuth } from "@/lib/auth-context";
import { getBuyerOrders } from "@/lib/actions/orders";
import { formatUsd } from "@/lib/format";
import type { BuyerOrder } from "@/lib/data/orders";
import type { BuyerOrderStatus } from "@/lib/types";

type Filter = "all" | BuyerOrderStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "settled", label: "Settled" },
  { id: "pending", label: "Clearing" },
  { id: "failed", label: "Failed" },
];

const STATUS_LABEL: Record<BuyerOrderStatus, string> = {
  settled: "Settled",
  pending: "Clearing",
  failed: "Failed",
};

export default function OrdersPage() {
  const { status, user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [orders, setOrders] = useState<BuyerOrder[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !user?.publicAddress) return;
    let cancelled = false;
    getBuyerOrders(user.publicAddress).then((result) => {
      if (!cancelled) setOrders(result);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user?.publicAddress]);

  if (status !== "authenticated") {
    return <SignInGate title="Sign in to see your orders" body="Your order history is tied to your connected wallet." />;
  }

  if (orders === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 size={26} strokeWidth={1.8} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  const matches = (order: BuyerOrder) => filter === "all" || order.status === filter;
  const thisWeek = orders.filter((o) => o.period === "this-week" && matches(o));
  const earlier = orders.filter((o) => o.period === "earlier" && matches(o));

  return (
    <AppShell variant="buyer">
      <Topbar
        left={<p className="text-[32px] font-semibold tracking-tight text-ink sm:text-[38px]">Your orders</p>}
        right={
          <>
            <BalancePill />
            <UserAvatar />
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
          <p className="mt-10 text-[15px] text-ink-faint">
            {orders.length === 0 ? "No orders yet — go find something to buy." : "No orders match this filter."}
          </p>
        )}
      </main>
    </AppShell>
  );
}

function OrderGroup({ label, orders }: { label: string; orders: BuyerOrder[] }) {
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

function OrderRow({ order, withDivider }: { order: BuyerOrder; withDivider: boolean }) {
  const tone = order.status === "settled" ? "success" : order.status === "failed" ? "error" : "warning";

  return (
    <div className={`flex flex-wrap items-center gap-4 py-4 ${withDivider ? "border-t border-divider" : ""}`}>
      <AvatarTile label={order.stallInitial} accent={order.stallAccent} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold text-ink">{order.itemName}</p>
        <p className="truncate text-[14px] text-ink-faint">
          {order.stallName} · {order.date}
        </p>
      </div>
      <StatusPill tone={tone}>{STATUS_LABEL[order.status]}</StatusPill>
      <p className="flex-none text-[16px] font-semibold text-ink">${formatUsd(order.amountUsd)}</p>
      {order.explorerUrl ? (
        <a
          href={order.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-none text-[14px] font-semibold text-ink transition-colors hover:text-primary"
        >
          Receipt
        </a>
      ) : (
        <span className="flex-none text-[14px] text-ink-quiet">Receipt</span>
      )}
    </div>
  );
}
