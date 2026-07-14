import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { products, stalls } from "./schema";
import { PRODUCTS, STALLS } from "../mock-data";

// Standalone script, run via `tsx` outside Next.js — imports db/client.ts's
// `import "server-only"` guard would throw here (that condition is only
// satisfied inside Next's own server compilation), so this builds its own
// connection instead of sharing the app's client module. `dotenv/config`'s
// default import only loads `.env` (which doesn't exist here) — Next's
// `.env.local` convention has to be loaded explicitly.
config({ path: ".env.local" });
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

const TRENDING_IDS = new Set(["kinfolk", "field-notes", "rue", "golden-hour"]);

async function seed() {
  console.log(`Seeding ${STALLS.length} stalls and ${PRODUCTS.length} products…`);

  const idMap = new Map<string, string>(); // mock-data id -> real uuid

  for (const stall of STALLS) {
    const [row] = await db
      .insert(stalls)
      .values({
        // walletAddress intentionally omitted (NULL) — these are unclaimed
        // demo stalls, not owned by any real merchant wallet.
        slug: stall.slug,
        name: stall.name,
        initial: stall.initial,
        tagline: stall.tagline,
        description: stall.description,
        accent: stall.accent,
        category: stall.category,
        establishedYear: stall.establishedYear,
        location: stall.location,
        featured: Boolean(stall.featured),
        trending: TRENDING_IDS.has(stall.id),
        illustration: stall.illustration,
        photoUrl: stall.photoUrl,
        payoutAddress: stall.payoutAddress,
        payoutToken: "USDC",
      })
      .onConflictDoNothing({ target: stalls.slug })
      .returning({ id: stalls.id });

    if (row) {
      idMap.set(stall.id, row.id);
    } else {
      console.log(`  skipped ${stall.slug} (already seeded)`);
    }
  }

  let productCount = 0;
  for (const product of PRODUCTS) {
    const stallId = idMap.get(product.stallId);
    if (!stallId) continue; // stall already existed — skip its products too, avoids duplicates on re-run

    await db.insert(products).values({
      stallId,
      name: product.name,
      meta: product.meta,
      priceUsd: product.priceUsd.toFixed(2),
      photoUrl: product.photoUrl,
      stock: 50,
    });
    productCount += 1;
  }

  console.log(`Seeded ${idMap.size} stalls and ${productCount} products.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
