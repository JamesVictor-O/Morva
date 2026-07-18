"use server";

import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { orderLines, orders, products } from "../db/schema";
import { getOrdersByBuyerAddress, type BuyerOrder } from "../data/orders";

export interface CheckoutLine {
  productId: string;
  quantity: number;
}

/** Buyer-facing — deliberately doesn't require a merchant session (buyers
 *  are never SIWE-verified; the payment itself, signed by their wallet via
 *  @morva/sdk, is what proves ownership). Prices are re-read from the
 *  database here, never trusted from the client cart. */
export async function createPendingOrder(params: {
  stallId: string;
  buyerAddress: string;
  buyerEmail?: string;
  lines: CheckoutLine[];
}): Promise<{ orderId: string; orderNumber: string }> {
  if (params.lines.length === 0) throw new Error("Cart is empty.");

  const stallProducts = await db.select().from(products).where(eq(products.stallId, params.stallId));
  const byId = new Map(stallProducts.map((product) => [product.id, product]));

  let totalUsd = 0;
  const lineValues = params.lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new Error("One of the items in your cart is no longer available.");
    // Stock is re-checked here, not trusted from the client cart — the
    // stall page's own UI blocks adding more than what's in stock, but
    // that's a courtesy, not the enforcement boundary.
    if (product.isDraft || line.quantity > product.stock) {
      throw new Error(`"${product.name}" doesn't have enough stock left for this order.`);
    }

    const unitPrice = Number(product.priceUsd);
    const lineTotal = unitPrice * line.quantity;
    totalUsd += lineTotal;

    return {
      productId: product.id,
      productNameSnapshot: product.name,
      unitPriceUsdSnapshot: unitPrice.toFixed(6),
      quantity: line.quantity,
      lineTotalUsd: lineTotal.toFixed(6),
    };
  });

  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      stallId: params.stallId,
      buyerAddress: params.buyerAddress,
      buyerEmail: params.buyerEmail,
      status: "pending",
      totalUsd: totalUsd.toFixed(6),
    })
    .returning();

  await db.insert(orderLines).values(lineValues.map((line) => ({ ...line, orderId: order.id })));

  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function markOrderSettled(
  orderId: string,
  result: { transactionId: string; explorerUrl: string }
): Promise<void> {
  // Guarded by status = "pending" so a duplicate call (e.g. a retried
  // status callback) can never decrement stock twice for the same order.
  const updated = await db
    .update(orders)
    .set({
      status: "settled",
      settlementTxId: result.transactionId,
      explorerUrl: result.explorerUrl,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });

  if (updated.length === 0) return;

  const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId));
  for (const line of lines) {
    if (!line.productId) continue;
    const [product] = await db.select().from(products).where(eq(products.id, line.productId)).limit(1);
    if (!product) continue;

    await db
      .update(products)
      .set({ stock: Math.max(0, product.stock - line.quantity), updatedAt: new Date() })
      .where(eq(products.id, line.productId));
  }
}

export async function markOrderFailed(orderId: string, reason: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "failed", failureReason: reason, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

/** Client-callable wrapper around data/orders.ts's server-only DAL —
 *  buyers have no server session (see createPendingOrder above), so the
 *  orders page calls this directly with whatever address is connected. */
export async function getBuyerOrders(buyerAddress: string): Promise<BuyerOrder[]> {
  return getOrdersByBuyerAddress(buyerAddress);
}
