import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { accentClasses } from "@/components/ui/accent";
import { MerchantSessionGate } from "@/components/auth/merchant-session-gate";
import { getMerchantSession } from "@/lib/auth/session";
import { getMyStall } from "@/lib/data/stalls";
import { getMyProducts } from "@/lib/data/products";
import { getMyPayments, getWeeklyStats } from "@/lib/data/orders";
import type { Accent } from "@/lib/types";

export default async function MerchantDashboardPage() {
  const session = await getMerchantSession();
  if (!session) return <MerchantSessionGate />;

  const stall = await getMyStall();
  if (!stall) redirect("/merchant/onboarding");

  const accent = stall.accent as Accent;
  const [products, settledPayments, weeklyStats] = await Promise.all([
    getMyProducts(),
    getMyPayments("settled"),
    getWeeklyStats(),
  ]);
  const { bg } = accentClasses(accent);
  const settledToday = settledPayments.reduce((sum, payment) => sum + payment.amountUsd, 0);

  return (
    <AppShell variant="merchant">
      <Topbar
        left={<p className="text-[20px] font-semibold text-ink">Your stall</p>}
        right={<AvatarTile label={stall.initial} accent={accent} size="lg" className="rounded-full" />}
      />

      <main className="grid grid-cols-1 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-[34px] lg:py-10">
        <div className="overflow-hidden rounded-[28px] border border-border-soft bg-surface-solid">
          <div className={`flex h-[170px] p-[26px] ${bg}`}>
            <div className="flex-1 rounded-[18px] border border-dashed border-ink/15 bg-surface-solid/60 font-mono text-[12px] text-ink/40" />
          </div>
          <div className="flex items-center gap-[14px] p-[22px]">
            <AvatarTile label={stall.initial} accent={accent} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[19px] font-semibold text-ink">{stall.name}</p>
              <p className="truncate text-[14px] text-ink-faint">{stall.tagline}</p>
            </div>
            <span className="flex-none rounded-full bg-success-bg px-[13px] py-1.5 text-[12px] font-medium text-success-fg">
              Live
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-border-soft bg-surface-solid p-[26px]">
          <div className="flex items-center justify-between">
            <p className="text-[17px] font-semibold text-ink">Where your money goes</p>
            <span className="cursor-default text-[14px] font-semibold text-ink-faint">Edit</span>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-faint">Payout destination</span>
              <span className="font-mono text-[14px] text-ink">
                {truncateAddress(stall.payoutAddress)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-faint">Paid in</span>
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-slate-bg text-[11px] font-semibold text-accent-slate-fg">
                  $
                </span>
                <span className="text-[15px] font-semibold text-ink">{stall.payoutToken}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-faint">Settlement</span>
              <span className="text-[14px] text-ink">Automatic, on every sale</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-faint">Catalog</span>
              <span className="text-[14px] text-ink">{products.length} products</span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-border-soft bg-surface-solid p-[26px] lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[17px] font-semibold text-ink">Recent payments</p>
            <p className="text-[14px] text-ink-faint">
              This week · ${weeklyStats.weekUsd.toFixed(2)} settled
              {settledToday > 0 ? ` · $${settledToday.toFixed(2)} shown below` : ""}
            </p>
          </div>
          <div className="mt-4">
            {settledPayments.length === 0 && (
              <p className="py-6 text-center text-[14px] text-ink-faint">No payments yet.</p>
            )}
            {settledPayments.map((payment, i) => (
              <div
                key={payment.id}
                className={`flex items-center gap-3 py-4 ${i > 0 ? "border-t border-divider" : ""}`}
              >
                <AvatarTile label={payment.buyerInitials} accent={payment.accent} size="md" className="mr-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {payment.buyerAddress} · {payment.itemName}
                  </p>
                  <p className="text-[13px] text-ink-faint">{payment.time}</p>
                </div>
                <p className="flex-none text-[16px] font-semibold text-ink">
                  ${payment.amountUsd.toFixed(2)}
                </p>
                <span className="flex-none rounded-full bg-success-bg px-[13px] py-1.5 text-[12px] font-medium text-success-fg">
                  Settled
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href={`/stalls/${stall.slug}`}
              className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"
            >
              View public stall <ExternalLink size={14} strokeWidth={1.8} />
            </a>
            <a href="/merchant/payments" className="text-[14px] font-semibold text-ink">
              View all payments
            </a>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
