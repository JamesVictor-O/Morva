import "server-only";
import { and, desc, eq, gte, or } from "drizzle-orm";
import { db } from "../db/client";
import { orderLines, orders } from "../db/schema";
import { getMyStall } from "./stalls";
import type { Accent, PaymentStatus } from "../types";

export interface MerchantPayment {
  id: string;
  buyerInitials: string;
  accent: Accent;
  itemName: string;
  buyerAddress: string;
  settledToAddress?: string;
  amountUsd: number;
  time: string;
  status: PaymentStatus;
}

function buyerInitials(address: string): string {
  return address.slice(2, 4).toUpperCase();
}

/** Merchant-scoped payments view (settled + pending orders — failed orders
 *  never surface here, matching what a merchant actually cares about
 *  seeing). Empty array if the wallet has no stall yet. */
export async function getMyPayments(statusFilter?: "settled" | "pending"): Promise<MerchantPayment[]> {
  const stall = await getMyStall();
  if (!stall) return [];

  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.stallId, stall.id),
        statusFilter ? eq(orders.status, statusFilter) : or(eq(orders.status, "settled"), eq(orders.status, "pending"))
      )
    )
    .orderBy(desc(orders.createdAt));

  const payments: MerchantPayment[] = [];
  for (const order of rows) {
    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id));
    const itemName =
      lines.length === 1
        ? lines[0].quantity > 1
          ? `${lines[0].productNameSnapshot} ×${lines[0].quantity}`
          : lines[0].productNameSnapshot
        : `${lines.length} items`;

    payments.push({
      id: order.id,
      buyerInitials: buyerInitials(order.buyerAddress),
      accent: stall.accent as Accent,
      itemName,
      buyerAddress: order.buyerAddress,
      settledToAddress: order.status === "settled" ? stall.payoutAddress : undefined,
      amountUsd: Number(order.totalUsd),
      time: order.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      status: order.status === "settled" ? "settled" : "pending",
    });
  }
  return payments;
}

export async function getWeeklyStats(): Promise<{ weekUsd: number; salesThisWeek: number }> {
  const stall = await getMyStall();
  if (!stall) return { weekUsd: 0, salesThisWeek: 0 };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.stallId, stall.id), eq(orders.status, "settled"), gte(orders.createdAt, weekAgo)));

  return {
    weekUsd: rows.reduce((sum, row) => sum + Number(row.totalUsd), 0),
    salesThisWeek: rows.length,
  };
}
