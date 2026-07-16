"use server";

import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { products } from "../db/schema";
import { getMyStall } from "../data/stalls";
import { uploadPhoto } from "../storage";

export async function createProduct(formData: FormData): Promise<void> {
  const stall = await getMyStall();
  if (!stall) throw new Error("No stall found for this wallet.");

  const name = String(formData.get("name") ?? "").trim();
  const meta = String(formData.get("meta") ?? "").trim();
  const priceUsd = Number(formData.get("priceUsd"));
  const stockInput = Number(formData.get("stock") ?? 0);
  const isDraft = formData.get("isDraft") === "true";
  const photo = formData.get("photo");

  if (!name || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("A name and a valid price are required.");
  }

  let photoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    photoUrl = await uploadPhoto(photo, `products/${stall.id}`);
  }

  await db.insert(products).values({
    stallId: stall.id,
    name,
    meta,
    priceUsd: priceUsd.toFixed(6),
    stock: Number.isFinite(stockInput) ? Math.max(0, Math.trunc(stockInput)) : 0,
    isDraft,
    photoUrl,
  });
}

/** Derives identity from the session and looks up by ownership rather than
 *  trusting a client-supplied stallId — a caller can name which product to
 *  act on, never which stall it belongs to. */
async function requireOwnedProduct(productId: string) {
  const stall = await getMyStall();
  if (!stall) throw new Error("No stall found for this wallet.");

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product || product.stallId !== stall.id) throw new Error("Product not found.");
  return product;
}

export async function updateProductPrice(productId: string, priceUsd: number): Promise<void> {
  await requireOwnedProduct(productId);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("Invalid price.");

  await db
    .update(products)
    .set({ priceUsd: priceUsd.toFixed(6), updatedAt: new Date() })
    .where(eq(products.id, productId));
}

export async function restockProduct(productId: string, delta: number): Promise<void> {
  const product = await requireOwnedProduct(productId);
  const nextStock = Math.max(0, product.stock + delta);

  await db.update(products).set({ stock: nextStock, updatedAt: new Date() }).where(eq(products.id, productId));
}
