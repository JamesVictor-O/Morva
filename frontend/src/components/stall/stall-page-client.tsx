"use client";

import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { BalancePill } from "@/components/checkout/balance-pill";
import { CartBar } from "@/components/checkout/cart-bar";
import { QuantityStepper } from "@/components/checkout/quantity-stepper";
import { UserAvatar } from "@/components/auth/user-avatar";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { IconButton } from "@/components/ui/icon-button";
import { MediaImage } from "@/components/ui/media-image";
import { accentClasses } from "@/components/ui/accent";
import { useCart } from "@/lib/cart-context";
import { formatUsd } from "@/lib/format";
import type { Product, Stall } from "@/lib/types";

export function StallPageClient({ stall, products }: { stall: Stall; products: Product[] }) {
  const { bg } = accentClasses(stall.accent);
  const { quantityFor, setQuantity } = useCart();

  return (
    <AppShell variant="buyer">
      <Topbar
        left={
          <Link
            href="/plaza"
            className="flex items-center gap-2 text-[14px] text-ink-faint transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} strokeWidth={1.6} />
            The Plaza
          </Link>
        }
        right={
          <>
            <BalancePill />
            <IconButton aria-label="Notifications">
              <Bell size={18} strokeWidth={1.6} className="text-ink" />
            </IconButton>
            <UserAvatar />
          </>
        }
      />

      <main className="px-5 py-8 pb-28 sm:px-8 lg:px-[34px] lg:py-10 lg:pb-28">
        <div className={`flex flex-col gap-6 rounded-[28px] p-7 sm:flex-row sm:items-center sm:p-9 ${bg}`}>
          <AvatarTile label={stall.initial} accent={stall.accent} size="2xl" className="!bg-surface-solid" />
          <div className="min-w-0 flex-1">
            <p className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
              {stall.name}
            </p>
            <p className="mt-1.5 max-w-[560px] text-[15px] leading-[1.5] text-ink-soft sm:text-[16px]">
              {stall.description}
            </p>
          </div>
          <p className="font-mono text-[12px] text-ink-faint sm:text-right">
            est. {stall.establishedYear}
            <br />
            {stall.location}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-[26px] border border-border-soft bg-surface-solid"
            >
              <MediaImage
                src={product.photoUrl}
                alt={product.name}
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className={`h-[200px] ${bg}`}
                fallback={
                  <div className={`flex h-full p-5 ${bg}`}>
                    <div className="flex-1 rounded-2xl border border-dashed border-ink/15 bg-surface-solid/60 font-mono text-[11px] text-ink/40" />
                  </div>
                }
              />
              <div className="flex flex-1 flex-col gap-4 p-[22px]">
                <div className="flex-1">
                  <p className="text-[18px] font-semibold text-ink">{product.name}</p>
                  <p className="mt-1 text-[14px] text-ink-faint">{product.meta}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[22px] font-semibold text-ink">${formatUsd(product.priceUsd)}</p>
                  <QuantityStepper
                    quantity={quantityFor(product.id)}
                    onChange={(next) => setQuantity(stall.slug, product.id, next)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <CartBar stallSlug={stall.slug} />
    </AppShell>
  );
}
