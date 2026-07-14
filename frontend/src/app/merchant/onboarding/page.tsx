import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { MerchantSessionGate } from "@/components/auth/merchant-session-gate";
import { getMerchantSession } from "@/lib/auth/session";
import { getMyStall } from "@/lib/data/stalls";

export default async function OnboardingPage() {
  const session = await getMerchantSession();
  if (!session) return <MerchantSessionGate />;

  const stall = await getMyStall();
  if (stall) redirect("/merchant/dashboard");

  return <OnboardingFlow />;
}
