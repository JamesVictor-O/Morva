import { notFound } from "next/navigation";
import { getStallBySlug } from "@/lib/data/stalls";
import { getProductsByStallId } from "@/lib/data/products";
import { StallPageClient } from "@/components/stall/stall-page-client";

// Stalls are created by merchants after deploy, not known at build time —
// no generateStaticParams; each slug renders on request instead.
export const dynamic = "force-dynamic";

export default async function StallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stall = await getStallBySlug(slug);
  if (!stall) notFound();

  const products = await getProductsByStallId(stall.id);

  return <StallPageClient stall={stall} products={products} />;
}
