import { notFound } from "next/navigation";
import { getProductsByStallId, getStallBySlug, STALLS } from "@/lib/mock-data";
import { StallPageClient } from "@/components/stall/stall-page-client";

export function generateStaticParams() {
  return STALLS.map((stall) => ({ slug: stall.slug }));
}

export default async function StallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stall = getStallBySlug(slug);
  if (!stall) notFound();

  const products = getProductsByStallId(stall.id);

  return <StallPageClient stall={stall} products={products} />;
}
