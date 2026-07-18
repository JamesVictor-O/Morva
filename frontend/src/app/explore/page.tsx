import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { SearchField } from "@/components/layout/search-field";
import { BalancePill } from "@/components/checkout/balance-pill";
import { UserAvatar } from "@/components/auth/user-avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { accentClasses } from "@/components/ui/accent";
import { getCatalogProducts } from "@/lib/data/products";
import { formatUsd } from "@/lib/format";
import { COLLECTIONS } from "@/lib/mock-data";
import type { CatalogProduct, Collection } from "@/lib/types";

// Product listings change as merchants stock/restock — not known at build
// time, same reasoning as the stall page.
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const catalogProducts = await getCatalogProducts();

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
          Explore
        </h1>
        <p className="mt-2 text-[16px] text-ink-soft">
          Hand-picked corners of the plaza, refreshed weekly.
        </p>

        <div className="mt-7 flex flex-col gap-8 rounded-[30px] bg-accent-peach-bg p-7 sm:p-10 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex-1">
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent-peach-fg">
              This week
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[38px]">
              Makers under $30,
              <br />
              worth every cent
            </h2>
            <p className="mt-3 max-w-[440px] text-[15px] leading-[1.55] text-ink-soft">
              Seven stalls, forty-odd small things. The kind of gifts that don&apos;t look like
              they came from an app.
            </p>
            <Button variant="dark" className="mt-6 px-6 py-3.5 text-[15px]">
              Browse the edit
              <ArrowRight size={16} strokeWidth={1.8} />
            </Button>
          </div>
          <div className="flex flex-1 gap-4">
            <div className="flex flex-1 items-center justify-center rounded-[22px] bg-surface-solid py-16 font-mono text-[12px] text-accent-peach-fg/70">
              product shot
            </div>
            <div className="flex flex-1 items-center justify-center rounded-[22px] bg-surface-solid py-16 font-mono text-[12px] text-accent-peach-fg/70">
              product shot
            </div>
          </div>
        </div>

        <h2 className="mt-10 text-[20px] font-semibold tracking-tight text-ink">Collections</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {COLLECTIONS.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>

        <h2 className="mt-10 text-[20px] font-semibold tracking-tight text-ink">
          Discover products
        </h2>
        <p className="mt-1 text-[14px] text-ink-faint">
          Real listings from every stall in the plaza, mixed together.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-[18px] sm:grid-cols-3 xl:grid-cols-4">
          {catalogProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {catalogProducts.length === 0 && (
          <p className="mt-4 text-[15px] text-ink-faint">
            Nothing in stock across the plaza yet — check back soon.
          </p>
        )}
      </main>
    </AppShell>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  const { bg, fg } = accentClasses(collection.accent);
  return (
    <div className={`rounded-[22px] p-5 sm:p-6 ${bg}`}>
      <p className={`text-[17px] font-semibold ${fg}`}>{collection.title}</p>
      <p className={`mt-6 text-[14px] opacity-70 ${fg}`}>{collection.subtitle}</p>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { bg } = accentClasses(product.stallAccent);
  return (
    <Link
      href={`/stalls/${product.stallSlug}`}
      className="flex flex-col overflow-hidden rounded-[22px] border border-border-soft bg-surface-solid transition-shadow hover:shadow-md"
    >
      <MediaImage
        src={product.photoUrl}
        alt={product.name}
        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
        aspectRatio="1 / 1"
        className={bg}
        fallback={
          <div className={`flex h-full w-full items-center justify-center p-4 ${bg}`}>
            <div className="h-full w-full rounded-2xl border border-dashed border-ink/15" />
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="truncate text-[15px] font-semibold text-ink">{product.name}</p>
        <p className="truncate text-[13px] text-ink-faint">{product.stallName}</p>
        <p className="mt-auto text-[17px] font-semibold text-ink">${formatUsd(product.priceUsd)}</p>
      </div>
    </Link>
  );
}
