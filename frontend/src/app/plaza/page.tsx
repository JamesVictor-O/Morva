"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { SearchField } from "@/components/layout/search-field";
import { BalancePill } from "@/components/checkout/balance-pill";
import { UserAvatar } from "@/components/auth/user-avatar";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { IconButton } from "@/components/ui/icon-button";
import { accentClasses } from "@/components/ui/accent";
import { StallArt } from "@/components/stall/stall-illustration";
import { MediaImage } from "@/components/ui/media-image";
import { STALLS, getFeaturedStall } from "@/lib/mock-data";

const CATEGORIES = ["All", "Home & table", "Plants", "Food", "Goods", "Reading"];

export default function PlazaPage() {
  const [category, setCategory] = useState("All");
  const featured = getFeaturedStall();
  const filtered = category === "All" ? STALLS : STALLS.filter((stall) => stall.category === category);
  const rest = filtered.filter((stall) => stall.id !== featured.id);
  const showFeatured = category === "All";

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
            <IconButton aria-label="Notifications">
              <Bell size={18} strokeWidth={1.6} className="text-ink" />
            </IconButton>
            <UserAvatar />
          </>
        }
      />

      <main className="px-5 py-8 sm:px-8 lg:px-[34px] lg:py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-ink sm:text-[38px]">
              The Plaza
            </h1>
            <p className="mt-2 text-[16px] text-ink-soft">
              Independent stalls, one balance.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-[18px] py-2.5 text-[14px] transition-colors ${
                  active
                    ? "bg-ink font-semibold text-white"
                    : "border border-border bg-surface-solid text-ink-soft hover:bg-fill"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-[15px] text-ink-faint">No stalls in this category yet.</p>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {showFeatured && (
              <FeaturedStallCard
                stall={featured}
                className="sm:col-span-2 sm:row-span-2 xl:col-span-2"
              />
            )}
            {rest.map((stall) => (
              <StallTile key={stall.id} stall={stall} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function FeaturedStallCard({
  stall,
  className = "",
}: {
  stall: (typeof STALLS)[number];
  className?: string;
}) {
  const { bg, fg } = accentClasses(stall.accent);
  return (
    <Link
      href={`/stalls/${stall.slug}`}
      className={`flex flex-col overflow-hidden rounded-[30px] border border-border-soft bg-surface-solid transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] ${className}`}
    >
      <div className={`relative flex flex-1 flex-col gap-4 p-6 ${bg}`}>
        <span className={`relative z-10 w-fit rounded-full bg-surface-solid px-[13px] py-1.5 text-[12px] font-semibold ${fg}`}>
          Featured stall
        </span>
        <MediaImage
          src={stall.photoUrl}
          alt={stall.name}
          sizes="(min-width: 1280px) 640px, (min-width: 640px) 50vw, 100vw"
          priority
          className="min-h-[160px] flex-1"
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <StallArt illustration={stall.illustration} className={`h-full max-h-[190px] w-full max-w-[360px] ${fg}`} />
            </div>
          }
        />
      </div>
      <div className="flex items-center gap-4 p-6">
        <AvatarTile label={stall.initial} accent={stall.accent} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[21px] font-semibold tracking-tight text-ink">
            {stall.name}
          </p>
          <p className="truncate text-[15px] text-ink-soft">{stall.tagline}</p>
        </div>
        <span className="hidden flex-none items-center gap-1.5 text-[15px] font-semibold text-ink sm:flex">
          Visit stall <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}

function StallTile({ stall }: { stall: (typeof STALLS)[number] }) {
  const { bg, fg } = accentClasses(stall.accent);
  return (
    <Link
      href={`/stalls/${stall.slug}`}
      className="flex flex-col self-start overflow-hidden rounded-[30px] border border-border-soft bg-surface-solid transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
    >
      <MediaImage
        src={stall.photoUrl}
        alt={stall.name}
        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        className={`h-[150px] ${bg}`}
        fallback={
          <div className={`flex h-full items-center justify-center p-[22px] ${bg}`}>
            <StallArt illustration={stall.illustration} className={`h-full w-full ${fg}`} />
          </div>
        }
      />
      <div className="flex items-center gap-[13px] p-5">
        <AvatarTile label={stall.initial} accent={stall.accent} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold text-ink">{stall.name}</p>
          <p className="truncate text-[13px] text-ink-faint">{stall.tagline}</p>
        </div>
      </div>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
