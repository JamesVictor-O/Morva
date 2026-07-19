import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { stalls } from "../db/schema";
import { requireMerchantSession } from "../auth/session";
import type { Stall } from "../types";

function toStallDto(row: typeof stalls.$inferSelect): Stall {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    initial: row.initial,
    tagline: row.tagline,
    description: row.description,
    accent: row.accent as Stall["accent"],
    category: row.category,
    establishedYear: row.establishedYear,
    location: row.location,
    featured: row.featured,
    payoutAddress: row.payoutAddress,
    payoutToken: row.payoutToken,
    payoutChainId: row.payoutChainId,
    illustration: row.illustration as Stall["illustration"],
    photoUrl: row.photoUrl ?? undefined,
  };
}

export async function getStalls(): Promise<Stall[]> {
  const rows = await db.select().from(stalls).where(eq(stalls.active, true));
  return rows.map(toStallDto);
}

export async function getStallBySlug(slug: string): Promise<Stall | undefined> {
  const [row] = await db
    .select()
    .from(stalls)
    .where(and(eq(stalls.slug, slug), eq(stalls.active, true)))
    .limit(1);
  return row ? toStallDto(row) : undefined;
}

export async function getFeaturedStall(): Promise<Stall> {
  const rows = await db.select().from(stalls).where(eq(stalls.active, true));
  if (rows.length === 0) throw new Error("No active stalls — run the seed script first.");
  const featured = rows.find((row) => row.featured);
  return toStallDto(featured ?? rows[0]);
}

export async function getTrendingStalls(): Promise<Stall[]> {
  const rows = await db
    .select()
    .from(stalls)
    .where(and(eq(stalls.active, true), eq(stalls.trending, true)));
  return rows.map(toStallDto);
}

/** Merchant-scoped — the signed-in merchant's own stall row (raw, includes
 *  walletAddress/payoutToken/active which public reads never expose), or
 *  null if this wallet hasn't onboarded yet. */
export async function getMyStall(): Promise<typeof stalls.$inferSelect | null> {
  const { address } = await requireMerchantSession();
  const [row] = await db.select().from(stalls).where(eq(stalls.walletAddress, address)).limit(1);
  return row ?? null;
}
