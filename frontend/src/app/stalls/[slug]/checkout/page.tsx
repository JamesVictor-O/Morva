import { notFound } from "next/navigation";
import { getStallBySlug, STALLS } from "@/lib/mock-data";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export function generateStaticParams() {
  return STALLS.map((stall) => ({ slug: stall.slug }));
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stall = getStallBySlug(slug);
  if (!stall) notFound();

  return <CheckoutPageClient stall={stall} />;
}
