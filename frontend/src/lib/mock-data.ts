import type {
  Category,
  Collection,
  MerchantProduct,
  Order,
  Payment,
  Product,
  Stall,
  UnifiedBalance,
  WeeklyStats,
} from "./types";

export const STALLS: Stall[] = [
  {
    id: "kinfolk",
    slug: "kinfolk-ceramics",
    name: "Kinfolk Ceramics",
    initial: "K",
    tagline: "Slow-made stoneware for everyday tables",
    description:
      "Slow-made stoneware thrown by hand in small batches. Plates, mugs and bowls meant to be used every single day.",
    accent: "purple",
    category: "Home & table",
    establishedYear: 2021,
    location: "Portland, OR",
    featured: true,
    payoutAddress: "0x7a3f4b2c9e1d8f6a5c3b0e7d2f9a1c4b8e6d3f2a",
    illustration: "ceramics",
    photoUrl: "/product-photos/kinfolk-vase-poppies.jpg",
  },
  {
    id: "verde",
    slug: "verde-botanicals",
    name: "Verde Botanicals",
    initial: "V",
    tagline: "Plants that forgive you",
    description: "Low-fuss houseplants and the pots to put them in.",
    accent: "green",
    category: "Plants",
    establishedYear: 2019,
    location: "Austin, TX",
    payoutAddress: "0x2b8c6a4f1e9d7c5b3a0f8e6d4c2b9a7e5d3c1f0b",
    illustration: "plant",
    photoUrl: "/stall-photos/verde-portrait-3158x4738.jpg",
  },
  {
    id: "golden-hour",
    slug: "golden-hour-bakery",
    name: "Golden Hour Bakery",
    initial: "G",
    tagline: "Sourdough & small-batch jam",
    description: "Sourdough, pastries & small-batch jam, baked in small runs.",
    accent: "yellow",
    category: "Food",
    establishedYear: 2022,
    location: "Brooklyn, NY",
    payoutAddress: "0x9c1e7b5a3f2d8c6b4a0e9f7d5c3b1a8e6d4f2c0a",
    illustration: "bread",
    photoUrl: "/stall-photos/golden-hour-square-4024x4024.jpg",
  },
  {
    id: "rue",
    slug: "rue-and-co",
    name: "Rue & Co.",
    initial: "R",
    tagline: "Everyday carry, built to age",
    description: "Leather goods built to age well, not to be replaced.",
    accent: "peach",
    category: "Goods",
    establishedYear: 2018,
    location: "Marfa, TX",
    payoutAddress: "0x4d8a2c6e0b9f7a5d3c1b8e6f4a2d0c9b7e5f3a1d",
    illustration: "tote-bag",
    photoUrl: "/product-photos/rue-tote-bags.jpg",
  },
  {
    id: "sole",
    slug: "sole-and-co",
    name: "Sole & Co.",
    initial: "S",
    tagline: "Shoes and small carry, worn in daily",
    description: "Sneakers, boots and loafers, picked for how they hold up after year one, not just day one.",
    accent: "beige",
    category: "Goods",
    establishedYear: 2020,
    location: "Los Angeles, CA",
    payoutAddress: "0x5f9b3d7a1c8e6f4b2a0d9c7e5b3f1a8d6c4e2f0b",
    illustration: "shoe",
    photoUrl: "/product-photos/sole-sneaker-nike.jpg",
  },
  {
    id: "nook",
    slug: "nook-books",
    name: "Nook Books",
    initial: "N",
    tagline: "Independent press & rare finds",
    description: "A small independent press storefront and rare-finds table.",
    accent: "beige",
    category: "Reading",
    establishedYear: 2020,
    location: "Chicago, IL",
    payoutAddress: "0x6e0b4d8a2c9f7e5b3d1a8c6f4e2b0d9a7c5e3f1b",
    illustration: "book",
  },
  {
    id: "field-notes",
    slug: "field-notes-coffee",
    name: "Field Notes Coffee",
    initial: "F",
    tagline: "Single-origin, roasted weekly",
    description: "Single-origin coffee, roasted in small batches every week.",
    accent: "green",
    category: "Food",
    establishedYear: 2023,
    location: "Seattle, WA",
    payoutAddress: "0x1f5c9e3a7b0d4f8c2a6e0b9d7f5c3a1e8b6d4f2c",
    illustration: "coffee",
    photoUrl: "/stall-photos/field-notes-portrait-4000x6000.jpg",
  },
];

export const PRODUCTS: Product[] = [
  { id: "plate", stallId: "kinfolk", name: "Speckled dinner plate", meta: "10.5\" · stoneware", priceUsd: 36, photoUrl: "/product-photos/kinfolk-plate-stack.jpg" },
  { id: "mug", stallId: "kinfolk", name: "Stoneware mug", meta: "12oz · matte glaze", priceUsd: 24, photoUrl: "/product-photos/kinfolk-mug-shelf.jpg" },
  { id: "bowl", stallId: "kinfolk", name: "Serving bowl", meta: "9\" · reactive green", priceUsd: 52, photoUrl: "/product-photos/kinfolk-bowl-cabbage-leaf.jpg" },
  { id: "pour-over", stallId: "kinfolk", name: "Pour-over set", meta: "dripper + carafe", priceUsd: 68 },

  { id: "monstera", stallId: "verde", name: "Monstera deliciosa", meta: "6\" nursery pot", priceUsd: 42 },
  { id: "pothos", stallId: "verde", name: "Golden pothos", meta: "4\" nursery pot", priceUsd: 18 },
  { id: "terracotta", stallId: "verde", name: "Terracotta planter", meta: "8\" · drainage hole", priceUsd: 26 },

  { id: "sourdough", stallId: "golden-hour", name: "Sourdough loaf", meta: "baked to order", priceUsd: 12 },
  { id: "croissant-box", stallId: "golden-hour", name: "Croissant box", meta: "box of 6", priceUsd: 28 },
  { id: "jam", stallId: "golden-hour", name: "Strawberry jam", meta: "8oz jar", priceUsd: 9 },

  { id: "weekender", stallId: "rue", name: "Leather weekender", meta: "full-grain, brass hardware", priceUsd: 180 },
  { id: "wallet", stallId: "rue", name: "Bifold wallet", meta: "vegetable-tanned", priceUsd: 58 },
  { id: "belt", stallId: "rue", name: "Everyday belt", meta: "1.25\" · brass buckle", priceUsd: 46 },
  { id: "canvas-tote", stallId: "rue", name: "Canvas tote", meta: "waxed canvas · leather trim", priceUsd: 74, photoUrl: "/product-photos/rue-tote-bags.jpg" },

  { id: "sneaker-vans", stallId: "sole", name: "Classic low-top sneaker", meta: "canvas · vulcanized sole", priceUsd: 68, photoUrl: "/product-photos/sole-sneaker-vans.jpg" },
  { id: "sneaker-court", stallId: "sole", name: "Court sneaker", meta: "leather · rubber cupsole", priceUsd: 92, photoUrl: "/product-photos/sole-sneaker-nike.jpg" },
  { id: "ankle-boot", stallId: "sole", name: "Croc-embossed ankle boot", meta: "leather · block heel", priceUsd: 148, photoUrl: "/product-photos/sole-boot.jpg" },
  { id: "suede-loafer", stallId: "sole", name: "Suede loafer", meta: "suede · leather sole", priceUsd: 118, photoUrl: "/product-photos/sole-loafer.jpg" },
  { id: "crossbody-bag", stallId: "sole", name: "Quilted crossbody bag", meta: "vegan leather · chain strap", priceUsd: 54, photoUrl: "/product-photos/sole-crossbody-bag.jpg" },

  { id: "poetry", stallId: "nook", name: "Poetry, Selected", meta: "first press · signed", priceUsd: 22 },
  { id: "notebook", stallId: "nook", name: "Field notebook", meta: "dot grid · 96pg", priceUsd: 14 },

  { id: "single-origin", stallId: "field-notes", name: "Single-origin bag", meta: "12oz · whole bean", priceUsd: 19 },
  { id: "cold-brew", stallId: "field-notes", name: "Cold brew concentrate", meta: "32oz bottle", priceUsd: 16 },
];

export const UNIFIED_BALANCE: UnifiedBalance = {
  totalUsd: 142.6,
  chains: [
    { chainId: 8453, name: "Base", initial: "B", amountUsd: 88.2 },
    { chainId: 42161, name: "Arbitrum", initial: "A", amountUsd: 34.4 },
    { chainId: 137, name: "Polygon", initial: "P", amountUsd: 20.0 },
  ],
};

const MERCHANT_SETTLEMENT_ADDRESS = "0x7a3f4b2c9e1d8f6a5c3b0e7d2f9a1c4b8e6d3f2a";

export const PAYMENTS: Payment[] = [
  {
    id: "p1",
    buyerInitials: "AR",
    accent: "green",
    itemName: "Sourdough loaf",
    buyerAddress: "0x4c1e…7fb2",
    settledToAddress: MERCHANT_SETTLEMENT_ADDRESS,
    amountUsd: 12,
    time: "9:24 AM",
    status: "settled",
  },
  {
    id: "p2",
    buyerInitials: "JD",
    accent: "peach",
    itemName: "Croissant box",
    buyerAddress: "0x91a0…2a4c",
    settledToAddress: MERCHANT_SETTLEMENT_ADDRESS,
    amountUsd: 28,
    time: "9:02 AM",
    status: "settled",
  },
  {
    id: "p3",
    buyerInitials: "MK",
    accent: "purple",
    itemName: "Strawberry jam ×2",
    buyerAddress: "0x2f6d…b8e1",
    settledToAddress: MERCHANT_SETTLEMENT_ADDRESS,
    amountUsd: 18,
    time: "8:47 AM",
    status: "settled",
  },
  {
    id: "p4",
    buyerInitials: "TL",
    accent: "yellow",
    itemName: "Morning bundle",
    buyerAddress: "0x8b3c…1d9f",
    settledToAddress: MERCHANT_SETTLEMENT_ADDRESS,
    amountUsd: 34,
    time: "8:15 AM",
    status: "settled",
  },
  {
    id: "p5",
    buyerInitials: "EW",
    accent: "beige",
    itemName: "Weekend bundle",
    buyerAddress: "0x3d9c…9c4a",
    amountUsd: 36,
    time: "8:03 AM",
    status: "pending",
  },
];

export const WEEKLY_STATS: WeeklyStats = {
  weekUsd: 892.4,
  salesThisWeek: 31,
};

export function getPaymentsByStatus(status: Payment["status"]): Payment[] {
  return PAYMENTS.filter((payment) => payment.status === status);
}

export function sumAmountUsd(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + payment.amountUsd, 0);
}

export const MERCHANT_PRODUCTS: MerchantProduct[] = [
  { id: "mp-sourdough", name: "Sourdough loaf", meta: "baked fresh daily", priceUsd: 12, stock: 42, status: "in-stock" },
  { id: "mp-croissant", name: "Croissant box", meta: "box of 6", priceUsd: 28, stock: 18, status: "in-stock" },
  { id: "mp-jam", name: "Strawberry jam", meta: "8oz jar", priceUsd: 9, stock: 3, status: "low-stock" },
  { id: "mp-baguette", name: "Baguette", meta: "baked to order", priceUsd: 6, stock: 0, status: "out-of-stock" },
  { id: "mp-cinnamon", name: "Cinnamon rolls, box of 4", meta: "warm, glazed", priceUsd: 14, stock: 64, status: "in-stock" },
  { id: "mp-tart", name: "Seasonal fruit tart", meta: "6\" · serves 4", priceUsd: 22, stock: 0, status: "draft" },
];

export function getStallBySlug(slug: string): Stall | undefined {
  return STALLS.find((stall) => stall.slug === slug);
}

export function getStallById(id: string): Stall | undefined {
  return STALLS.find((stall) => stall.id === id);
}

export function getProductsByStallId(stallId: string): Product[] {
  return PRODUCTS.filter((product) => product.stallId === stallId);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function getFeaturedStall(): Stall {
  return STALLS.find((stall) => stall.featured) ?? STALLS[0];
}

export const COLLECTIONS: Collection[] = [
  { id: "fresh", title: "Fresh this week", subtitle: "12 new stalls", accent: "green" },
  { id: "handmade", title: "Made by hand", subtitle: "28 stalls", accent: "purple" },
  { id: "coffee", title: "Good with coffee", subtitle: "9 stalls", accent: "yellow" },
  { id: "under-30", title: "Under $30", subtitle: "40+ finds", accent: "peach" },
];

const TRENDING_STALL_IDS = ["kinfolk", "field-notes", "rue", "golden-hour"];

export function getTrendingStalls(): Stall[] {
  return TRENDING_STALL_IDS.map((id) => STALLS.find((stall) => stall.id === id)!);
}

export const CATEGORIES: Category[] = [
  { id: "home-table", title: "Home & table", subtitle: "34 stalls", accent: "purple", icon: "home" },
  { id: "plants", title: "Plants", subtitle: "18 stalls", accent: "green", icon: "sprout" },
  { id: "food-drink", title: "Food & drink", subtitle: "41 stalls", accent: "yellow", icon: "coffee" },
  { id: "goods-carry", title: "Goods & carry", subtitle: "26 stalls", accent: "peach", icon: "shopping-bag" },
  { id: "reading", title: "Reading", subtitle: "15 stalls", accent: "beige", icon: "book-open" },
  { id: "art-prints", title: "Art & prints", subtitle: "22 stalls", accent: "green", icon: "star" },
];

export const ORDERS: Order[] = [
  { id: "o1", stallId: "kinfolk", productName: "Speckled dinner plate", date: "Jul 2", status: "in-progress", period: "this-week", amountUsd: 36 },
  { id: "o2", stallId: "field-notes", productName: "Ethiopia Guji · 2 bags", date: "Jul 1", status: "delivered", period: "this-week", amountUsd: 32 },
  { id: "o3", stallId: "rue", productName: "Waxed canvas tote", date: "Jun 24", status: "delivered", period: "earlier", amountUsd: 58 },
  { id: "o4", stallId: "golden-hour", productName: "Sourdough + jam bundle", date: "Jun 20", status: "delivered", period: "earlier", amountUsd: 21 },
  { id: "o5", stallId: "nook", productName: "The Overstory — paperback", date: "Jun 15", status: "delivered", period: "earlier", amountUsd: 18 },
];
