import { PlazaPageClient } from "@/components/plaza/plaza-page-client";
import { getStalls, getFeaturedStall } from "@/lib/data/stalls";

// Merchant-created stalls change after deploy — read fresh on every
// request rather than baking today's stall list into the build.
export const dynamic = "force-dynamic";

export default async function PlazaPage() {
  const [stalls, featured] = await Promise.all([getStalls(), getFeaturedStall()]);

  return <PlazaPageClient stalls={stalls} featured={featured} />;
}
