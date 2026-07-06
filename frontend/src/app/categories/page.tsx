import type { LucideIcon } from "lucide-react";
import { BookOpen, Coffee, Home, ShoppingBag, ShoppingCart, Sprout, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { SearchField } from "@/components/layout/search-field";
import { BalancePill } from "@/components/checkout/balance-pill";
import { UserAvatar } from "@/components/auth/user-avatar";
import { IconButton } from "@/components/ui/icon-button";
import { accentClasses } from "@/components/ui/accent";
import { CATEGORIES } from "@/lib/mock-data";
import type { Category, CategoryIcon } from "@/lib/types";

const ICONS: Record<CategoryIcon, LucideIcon> = {
  home: Home,
  sprout: Sprout,
  coffee: Coffee,
  "shopping-bag": ShoppingBag,
  "book-open": BookOpen,
  star: Star,
};

export default function CategoriesPage() {
  return (
    <AppShell
      variant="buyer"
      cta={{
        title: "Have something to sell?",
        body: "Open a stall in minutes.",
        actionLabel: "Open your stall",
        href: "/merchant/onboarding",
      }}
    >
      <Topbar
        left={<SearchField placeholder="Search stalls and products" />}
        right={
          <>
            <BalancePill />
            <IconButton aria-label="Cart">
              <ShoppingCart size={18} strokeWidth={1.6} className="text-ink" />
            </IconButton>
            <UserAvatar />
          </>
        }
      />

      <main className="px-5 py-8 sm:px-8 lg:px-[34px] lg:py-10">
        <h1 className="text-[32px] font-semibold tracking-tight text-ink sm:text-[38px]">
          Categories
        </h1>
        <p className="mt-2 text-[16px] text-ink-soft">Every aisle of the plaza.</p>

        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const { bg, fg } = accentClasses(category.accent);
  const Icon = ICONS[category.icon];
  return (
    <div className={`rounded-[26px] p-7 ${bg}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-solid">
        <Icon size={22} strokeWidth={1.8} className={fg} />
      </div>
      <p className="mt-8 text-[22px] font-semibold text-ink">{category.title}</p>
      <p className={`mt-1 text-[14px] opacity-80 ${fg}`}>{category.subtitle}</p>
    </div>
  );
}
