export type Accent = "purple" | "green" | "yellow" | "peach" | "beige";

export type StallIllustration = "ceramics" | "plant" | "bread" | "tote-bag" | "coffee" | "book" | "shoe";

export interface Stall {
  id: string;
  slug: string;
  name: string;
  initial: string;
  tagline: string;
  description: string;
  accent: Accent;
  category: string;
  establishedYear: number;
  location: string;
  featured?: boolean;
  payoutAddress: string;
  /** Absent for the pre-backend mock stalls — checkout treats a missing
   *  value as "USDC". */
  payoutToken?: string;
  /** Absent for the pre-backend mock stalls — checkout treats a missing
   *  value as Arbitrum One (42161), matching the DB column's own default. */
  payoutChainId?: number;
  illustration: StallIllustration;
  /** Vendor-uploaded photo — arbitrary source dimensions/aspect ratio/
   *  quality. Falls back to `illustration` when absent. */
  photoUrl?: string;
}

export interface Product {
  id: string;
  stallId: string;
  name: string;
  meta: string;
  priceUsd: number;
  /** Same vendor-upload caveats as Stall.photoUrl. */
  photoUrl?: string;
  stock: number;
}

/** A product as it appears in a cross-vendor browse feed (Explore) —
 *  carries just enough stall context to attribute and link to it, without
 *  the full Stall shape a stall page itself needs. */
export interface CatalogProduct {
  id: string;
  name: string;
  meta: string;
  priceUsd: number;
  photoUrl?: string;
  stallSlug: string;
  stallName: string;
  stallAccent: Accent;
}

export interface ChainHolding {
  chainId: number;
  name: string;
  initial: string;
  amountUsd: number;
}

export interface UnifiedBalance {
  totalUsd: number;
  chains: ChainHolding[];
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  accent: Accent;
}

export type PaymentStatus = "settled" | "pending";

export interface Payment {
  id: string;
  buyerInitials: string;
  accent: Accent;
  itemName: string;
  buyerAddress: string;
  /** Undefined while status is "pending" — settlement hasn't landed yet. */
  settledToAddress?: string;
  amountUsd: number;
  time: string;
  status: PaymentStatus;
}

export interface WeeklyStats {
  weekUsd: number;
  salesThisWeek: number;
}

export type MerchantProductStatus = "in-stock" | "low-stock" | "out-of-stock" | "draft";

export interface MerchantProduct {
  id: string;
  name: string;
  meta: string;
  priceUsd: number;
  photoUrl?: string;
  stock: number;
  status: MerchantProductStatus;
}

/** A crypto payment settles or it doesn't — there's no shipping-tracked
 *  "in progress" state once the on-chain transfer itself is what fulfills
 *  the order, so this mirrors orders.status in db/schema.ts directly
 *  rather than the delivery-tracking vocabulary an ecommerce mock once used. */
export type BuyerOrderStatus = "pending" | "settled" | "failed";

export type CategoryIcon = "home" | "sprout" | "coffee" | "shopping-bag" | "book-open" | "star";

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  accent: Accent;
  icon: CategoryIcon;
}
