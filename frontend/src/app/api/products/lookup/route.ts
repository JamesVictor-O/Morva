import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data/products";

/** Public — product listings are already public data on stall pages. Used
 *  by cart-context.tsx to resolve {productId, quantity} lines (all it ever
 *  stores) into displayable name/price/photo. */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : [];

  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
