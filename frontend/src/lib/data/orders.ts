import "server-only";
import { and, desc, eq, gte, or } from "drizzle-orm";
import { db } from "../db/client";
import { orderLines, orders, stalls } from "../db/schema";
import { getMyStall } from "./stalls";
import type { Accent, BuyerOrderStatus, PaymentStatus } from "../types";

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
  explorerUrl?: string;
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
      explorerUrl: order.explorerUrl ?? undefined,
    });
  }
  return payments;
}

export interface BuyerOrder {
  id: string;
  orderNumber: string;
  stallSlug: string;
  stallName: string;
  stallInitial: string;
  stallAccent: Accent;
  itemName: string;
  status: BuyerOrderStatus;
  amountUsd: number;
  date: string;
  period: "this-week" | "earlier";
  explorerUrl?: string;
}

/** Buyer-facing — scoped to whatever address the caller passes, not a
 *  server session. Buyers are never SIWE-verified (see createPendingOrder);
 *  a client-supplied address here only ever reveals that address's own
 *  order history, which is no more sensitive than what's already visible
 *  on-chain for any address. */
export async function getOrdersByBuyerAddress(buyerAddress: string): Promise<BuyerOrder[]> {
  const rows = await db
    .select({ order: orders, stall: stalls })
    .from(orders)
    .innerJoin(stalls, eq(orders.stallId, stalls.id))
    .where(eq(orders.buyerAddress, buyerAddress))
    .orderBy(desc(orders.createdAt));

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const result: BuyerOrder[] = [];
  for (const { order, stall } of rows) {
    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, order.id));
    const itemName =
      lines.length === 1
        ? lines[0].quantity > 1
          ? `${lines[0].productNameSnapshot} ×${lines[0].quantity}`
          : lines[0].productNameSnapshot
        : `${lines.length} items`;

    result.push({
      id: order.id,
      orderNumber: order.orderNumber,
      stallSlug: stall.slug,
      stallName: stall.name,
      stallInitial: stall.initial,
      stallAccent: stall.accent as Accent,
      itemName,
      status: order.status,
      amountUsd: Number(order.totalUsd),
      date: order.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      period: order.createdAt.getTime() >= weekAgo ? "this-week" : "earlier",
      explorerUrl: order.explorerUrl ?? undefined,
    });
  }
  return result;
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
