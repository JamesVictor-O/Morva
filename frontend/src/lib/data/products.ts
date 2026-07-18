import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { products } from "../db/schema";
import { getMyStall } from "./stalls";
import type { MerchantProduct, MerchantProductStatus, Product } from "../types";

const LOW_STOCK_THRESHOLD = 5;

function deriveStatus(stock: number, isDraft: boolean): MerchantProductStatus {
  if (isDraft) return "draft";
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

/** Public catalog view — excludes drafts, no stock/status exposed. */
export async function getProductsByStallId(stallId: string): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.stallId, stallId), eq(products.isDraft, false)));

  return rows.map((row) => ({
    id: row.id,
    stallId: row.stallId,
    name: row.name,
    meta: row.meta,
    priceUsd: Number(row.priceUsd),
    photoUrl: row.photoUrl ?? undefined,
  }));
}

/** Looks up specific products by id, regardless of stall — used to resolve
 *  cart lines (see cart-context.tsx / api/products/lookup), which only
 *  ever store {productId, quantity} client-side. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const rows = await db.select().from(products).where(inArray(products.id, ids));
  return rows.map((row) => ({
    id: row.id,
    stallId: row.stallId,
    name: row.name,
    meta: row.meta,
    priceUsd: Number(row.priceUsd),
    photoUrl: row.photoUrl ?? undefined,
  }));
}

/** Merchant-scoped inventory view — includes drafts, stock counts, and a
 *  derived status. Empty array (not an error) if the wallet has no stall
 *  yet, so callers can render an onboarding prompt instead of a crash. */
export async function getMyProducts(): Promise<MerchantProduct[]> {
  const stall = await getMyStall();
  if (!stall) return [];

  const rows = await db.select().from(products).where(eq(products.stallId, stall.id));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    meta: row.meta,
    priceUsd: Number(row.priceUsd),
    photoUrl: row.photoUrl ?? undefined,
    stock: row.stock,
    status: deriveStatus(row.stock, row.isDraft),
  }));
}
