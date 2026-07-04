import type { LucideIcon } from "lucide-react";
import { Compass, LayoutGrid, Package, Receipt, Settings, Store, Wallet } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Whether a real page exists at href yet — unbuilt items render as inert
   *  chrome instead of a dead link. */
  enabled?: boolean;
}

export const BUYER_NAV: NavItem[] = [
  { label: "Plaza", href: "/", icon: Store, enabled: true },
  { label: "Explore", href: "/explore", icon: Compass, enabled: true },
  { label: "Categories", href: "/categories", icon: LayoutGrid, enabled: true },
  { label: "Orders", href: "/orders", icon: Receipt, enabled: true },
];

export const MERCHANT_NAV: NavItem[] = [
  { label: "Your stall", href: "/merchant/dashboard", icon: LayoutGrid, enabled: true },
  { label: "Products", href: "/merchant/products", icon: Package, enabled: true },
  { label: "Payments", href: "/merchant/payments", icon: Wallet, enabled: true },
  { label: "Settings", href: "/merchant/settings", icon: Settings },
];
