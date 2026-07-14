import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** One row per merchant stall. `walletAddress` is nullable + unique so the
 *  seeded demo stalls (unclaimed) can coexist with real merchant-owned rows
 *  — Postgres allows any number of NULLs under a unique constraint. One
 *  stall per address, matching contracts/src/MorvaRegistry.sol's design. */
export const stalls = pgTable("stalls", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  initial: text("initial").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  accent: text("accent").notNull(),
  category: text("category").notNull(),
  establishedYear: integer("established_year").notNull(),
  location: text("location").notNull(),
  featured: boolean("featured").notNull().default(false),
  trending: boolean("trending").notNull().default(false),
  illustration: text("illustration").notNull(),
  photoUrl: text("photo_url"),
  payoutAddress: text("payout_address").notNull(),
  payoutToken: text("payout_token").notNull().default("USDC"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Unifies mock-data's old Product/MerchantProduct split into one row.
 *  Status (in-stock/low-stock/out-of-stock/draft) is derived from
 *  stock + isDraft at read time (see data/products.ts) rather than stored,
 *  so it can never drift from the actual stock count. */
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  stallId: uuid("stall_id")
    .notNull()
    .references(() => stalls.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  meta: text("meta").notNull(),
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
  photoUrl: text("photo_url"),
  stock: integer("stock").notNull().default(0),
  isDraft: boolean("is_draft").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  stallId: uuid("stall_id")
    .notNull()
    .references(() => stalls.id, { onDelete: "restrict" }),
  buyerAddress: text("buyer_address").notNull(),
  buyerEmail: text("buyer_email"),
  status: text("status", { enum: ["pending", "settled", "failed"] })
    .notNull()
    .default("pending"),
  totalUsd: numeric("total_usd", { precision: 12, scale: 2 }).notNull(),
  settlementTxId: text("settlement_tx_id"),
  explorerUrl: text("explorer_url"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Snapshots product name/price at time of purchase so later edits to the
 *  product catalog never rewrite order history. */
export const orderLines = pgTable("order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  unitPriceUsdSnapshot: numeric("unit_price_usd_snapshot", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalUsd: numeric("line_total_usd", { precision: 12, scale: 2 }).notNull(),
});

/** Short-lived SIWE handshake state — one row per issued nonce, deleted
 *  once consumed by /api/auth/verify or expired. */
export const authNonces = pgTable("auth_nonces", {
  nonce: text("nonce").primaryKey(),
  address: text("address").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
