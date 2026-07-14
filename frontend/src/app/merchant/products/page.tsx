import { redirect } from "next/navigation";
import { MerchantSessionGate } from "@/components/auth/merchant-session-gate";
import { ProductsPageClient } from "@/components/merchant/products-page-client";
import { getMerchantSession } from "@/lib/auth/session";
import { getMyStall } from "@/lib/data/stalls";
import { getMyProducts } from "@/lib/data/products";
import type { Accent } from "@/lib/types";

export default async function ProductsPage() {
  const session = await getMerchantSession();
  if (!session) return <MerchantSessionGate />;

  const stall = await getMyStall();
  if (!stall) redirect("/merchant/onboarding");

  const products = await getMyProducts();

  return <ProductsPageClient products={products} stallInitial={stall.initial} stallAccent={stall.accent as Accent} />;
}
