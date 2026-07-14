import { notFound } from "next/navigation";
import { getStallBySlug } from "@/lib/data/stalls";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

// Same reasoning as stalls/[slug]/page.tsx — no generateStaticParams,
// stalls aren't known at build time.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stall = await getStallBySlug(slug);
  if (!stall) notFound();

  return <CheckoutPageClient stall={stall} />;
}
