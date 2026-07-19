import { redirect } from "next/navigation";
import { MerchantSessionGate } from "@/components/auth/merchant-session-gate";
import { SettingsPageClient } from "@/components/merchant/settings-page-client";
import { getMerchantSession } from "@/lib/auth/session";
import { getMyStall } from "@/lib/data/stalls";
import type { Accent } from "@/lib/types";

export default async function MerchantSettingsPage() {
  const session = await getMerchantSession();
  if (!session) return <MerchantSessionGate />;

  const stall = await getMyStall();
  if (!stall) redirect("/merchant/onboarding");

  return (
    <SettingsPageClient
      stallInitial={stall.initial}
      stallAccent={stall.accent as Accent}
      payoutAddress={stall.payoutAddress}
      payoutToken={stall.payoutToken}
      payoutChainId={stall.payoutChainId}
    />
  );
}
