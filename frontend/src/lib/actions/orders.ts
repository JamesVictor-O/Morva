"use server";

import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { orderLines, orders, products } from "../db/schema";

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
  await db
    .update(orders)
    .set({
      status: "settled",
      settlementTxId: result.transactionId,
      explorerUrl: result.explorerUrl,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

export async function markOrderFailed(orderId: string, reason: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "failed", failureReason: reason, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}
