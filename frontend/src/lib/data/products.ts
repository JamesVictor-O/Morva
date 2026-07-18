import "server-only";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { products, stalls } from "../db/schema";
import { getMyStall } from "./stalls";
import type { Accent, CatalogProduct, MerchantProduct, MerchantProductStatus, Product } from "../types";

const LOW_STOCK_THRESHOLD = 5;

function deriveStatus(stock: number, isDraft: boolean): MerchantProductStatus {
  if (isDraft) return "draft";
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

/** Public catalog view — excludes drafts. Carries the real stock count so
 *  buyers (and the checkout flow re-validating server-side) can't treat an
 *  out-of-stock product as purchasable — it was previously omitted here
 *  entirely, which is exactly what let a 0-stock product still show "Add
 *  to cart" on the stall page. */
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
    stock: row.stock,
  }));
}

/** Cross-vendor browse view (Explore page) — real products pulled from
 *  every active stall, mixed together rather than grouped by vendor, the
 *  way an actual marketplace discovery feed works. Excludes drafts and
 *  anything currently out of stock (nothing to browse to if it can't be
 *  bought), newest listings first. */
export async function getCatalogProducts(limit = 24): Promise<CatalogProduct[]> {
  const rows = await db
    .select({ product: products, stall: stalls })
    .from(products)
    .innerJoin(stalls, eq(products.stallId, stalls.id))
    .where(and(eq(products.isDraft, false), eq(stalls.active, true), gt(products.stock, 0)))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return rows.map(({ product, stall }) => ({
    id: product.id,
    name: product.name,
    meta: product.meta,
    priceUsd: Number(product.priceUsd),
    photoUrl: product.photoUrl ?? undefined,
    stallSlug: stall.slug,
    stallName: stall.name,
    stallAccent: stall.accent as Accent,
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
    stock: row.stock,
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
