"use server";

import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { stalls } from "../db/schema";
import { requireMerchantSession } from "../auth/session";
import { getMyStall } from "../data/stalls";
import { uploadPhoto } from "../storage";
import type { Accent } from "../types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "stall";
  let slug = root;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select({ id: stalls.id }).from(stalls).where(eq(stalls.slug, slug)).limit(1);
    if (!existing) return slug;
    suffix += 1;
    slug = `${root}-${suffix}`;
  }
}

/** Onboarding today collects {name, tagline, accent, payoutAddress,
 *  payoutToken, logo} — description/category/establishedYear/location/
 *  illustration have no source field yet, so this fills reasonable
 *  defaults rather than expanding the onboarding UI or loosening the
 *  Stall type every other component already depends on. */
export async function createStall(formData: FormData): Promise<{ slug: string }> {
  const { address } = await requireMerchantSession();

  const existing = await getMyStall();
  if (existing) throw new Error("This wallet already has a stall.");

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const accent = String(formData.get("accent") ?? "purple") as Accent;
  const payoutAddress = String(formData.get("payoutAddress") ?? "").trim();
  const payoutToken = String(formData.get("payoutToken") ?? "USDC").trim();
  const logo = formData.get("logo");

  if (!name || !tagline || !payoutAddress) {
    throw new Error("Name, tagline, and payout address are required.");
  }

  const slug = await uniqueSlug(slugify(name));

  let photoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    photoUrl = await uploadPhoto(logo, `stalls/${slug}`);
  }

  await db.insert(stalls).values({
    walletAddress: address,
    slug,
    name,
    initial: name.charAt(0).toUpperCase(),
    tagline,
    description: tagline,
    accent,
    category: "General",
    establishedYear: new Date().getFullYear(),
    location: "Online",
    illustration: "tote-bag",
    photoUrl,
    payoutAddress,
    payoutToken,
  });

  return { slug };
}

export async function updateStallPayout(formData: FormData): Promise<void> {
  const stall = await getMyStall();
  if (!stall) throw new Error("No stall found for this wallet.");

  const payoutAddress = String(formData.get("payoutAddress") ?? "").trim();
  const payoutToken = String(formData.get("payoutToken") ?? stall.payoutToken).trim();
  if (!payoutAddress) throw new Error("Payout address is required.");

  await db
    .update(stalls)
    .set({ payoutAddress, payoutToken, updatedAt: new Date() })
    .where(eq(stalls.id, stall.id));
}
