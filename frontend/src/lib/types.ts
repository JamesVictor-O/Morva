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
  stock: number;
  status: MerchantProductStatus;
}

export type OrderStatus = "in-progress" | "delivered";
export type OrderPeriod = "this-week" | "earlier";

export interface Order {
  id: string;
  stallId: string;
  productName: string;
  date: string;
  status: OrderStatus;
  period: OrderPeriod;
  amountUsd: number;
}

export type CategoryIcon = "home" | "sprout" | "coffee" | "shopping-bag" | "book-open" | "star";

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  accent: Accent;
  icon: CategoryIcon;
}
