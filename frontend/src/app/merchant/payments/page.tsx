import { redirect } from "next/navigation";
import { MerchantSessionGate } from "@/components/auth/merchant-session-gate";
import { PaymentsPageClient } from "@/components/merchant/payments-page-client";
import { getMerchantSession } from "@/lib/auth/session";
import { getMyStall } from "@/lib/data/stalls";
import { getMyPayments, getWeeklyStats } from "@/lib/data/orders";
import type { Accent } from "@/lib/types";

export default async function PaymentsPage() {
  const session = await getMerchantSession();
  if (!session) return <MerchantSessionGate />;

  const stall = await getMyStall();
  if (!stall) redirect("/merchant/onboarding");

  const [payments, weeklyStats] = await Promise.all([getMyPayments(), getWeeklyStats()]);

  return (
    <PaymentsPageClient
      payments={payments}
      weeklyStats={weeklyStats}
      stallInitial={stall.initial}
      stallAccent={stall.accent as Accent}
      payoutAddress={stall.payoutAddress}
      payoutToken={stall.payoutToken}
    />
  );
}
