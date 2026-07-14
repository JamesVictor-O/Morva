"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowUpRight, CheckCircle2, Wallet, Zap } from "lucide-react";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { MediaImage } from "@/components/ui/media-image";
import { accentClasses } from "@/components/ui/accent";
import { HeaderAuthActions } from "@/components/auth/header-auth-actions";
import { ProtectedCta } from "@/components/auth/protected-cta";
import { FloatIdle } from "@/components/motion/float-idle";
import { Parallax } from "@/components/motion/parallax";
import { ScrollReveal, type ScrollRevealVariant } from "@/components/motion/scroll-reveal";
import { HERO_TIMING, SPRING } from "@/lib/motion/tokens";
import { STALLS, getStallBySlug } from "@/lib/mock-data";
import type { Stall } from "@/lib/types";

/* ─────────────────────────────────────────────────────────
 * LANDING PAGE MOTION MAP
 *
 * Hero is the only mount-choreographed section (stage-driven, see
 * HERO_TIMING below) — it's above the fold, so it animates on a timer
 * the instant the page loads.
 *
 * Everything below the fold uses ScrollReveal (GSAP ScrollTrigger) instead
 * of a mount timer — each section/card animates in only once it's actually
 * scrolled into view, along its own curved trajectory (see
 * components/motion/scroll-reveal.tsx for the variant table).
 *
 *   Hero            — mount cascade: eyebrow → wordmark → image → CTAs → meta
 *   Thesis           — rises as it enters view
 *   FeatureTriptych   — 3 cards, alternating left/up/right entrances, staggered
 *   PlazaPreview      — big card converges from the left; small cards drift
 *                       in from alternating directions, staggered
 *   HowItWorks        — 3 steps rise in sequence
 *   MerchantBand       — rises as a whole band
 *   FinalCta           — rises as it enters view
 * ───────────────────────────────────────────────────────── */

const GITHUB_URL = "https://github.com/JamesVictor-O/Morva";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For sellers", href: "#for-sellers" },
  { label: "Developers", href: "/sdk" },
];

const FEATURES: Array<{ icon: LucideIcon; accent: string; title: string; body: string }> = [
  {
    icon: CheckCircle2,
    accent: "bg-accent-green-bg text-accent-green-fg",
    title: "One balance, everywhere",
    body: "Assets scattered across networks show up as a single number. Spend it at any stall without thinking about where it lives.",
  },
  {
    icon: Zap,
    accent: "bg-accent-yellow-bg text-accent-yellow-fg",
    title: "One tap to pay",
    body: "No network switching, no approvals, no gas prompts. Tap buy, and Morva moves the funds while you carry on.",
  },
  {
    icon: Wallet,
    accent: "bg-accent-peach-bg text-accent-peach-fg",
    title: "Sellers get real money",
    body: "Merchants pick what they want to receive. Every sale settles automatically to their account, in the token they chose.",
  },
];

const STEPS = [
  {
    title: "Find a stall you like",
    body: "Browse the plaza the way you'd browse any shop. Real merchants, real goods, no jargon.",
  },
  {
    title: "Tap buy, pay from your balance",
    body: "One price, one button. Morva pulls from your unified balance — you never pick a chain.",
  },
  {
    title: "Done — funds settle for you",
    body: "Behind the scenes we route and settle. You get a receipt; the seller gets paid, in what they asked for.",
  },
];

// The five stalls with a real photo on file — the ones worth putting in front
// of a first-time visitor before they've browsed the plaza themselves.
const PREVIEW_SLUGS = ["verde-botanicals", "golden-hour-bakery", "rue-and-co", "field-notes-coffee", "kinfolk-ceramics"];

export default function LandingPage() {
  const previewStalls = PREVIEW_SLUGS.map((slug) => getStallBySlug(slug)).filter((s): s is Stall => Boolean(s));
  const [bigPreview, ...restPreview] = previewStalls;

  return (
    <div className="bg-app-bg">
      <SiteHeader />

      <main>
        <Hero />
        <TrustMarquee />
        <Thesis />
        <FeatureTriptych />
        <PlazaPreview big={bigPreview} rest={restPreview} />
        <HowItWorks />
        <MerchantBand />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-app-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-5 py-4 sm:px-8 lg:px-14">
        <Link href="/" className="flex items-center gap-[10px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[15px] font-semibold text-white">
            M
          </div>
          <span className="text-[19px] font-semibold tracking-tight text-ink">Morva</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <HeaderAuthActions />
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
 * HERO STORYBOARD
 *
 *    0ms   eyebrow ("Shopping that moves with you") fades in + rises
 *  150ms   MORVA wordmark fades in + rises
 *  350ms   tote-bag image fades in + rises, then floats + parallaxes
 *  600ms   CTA buttons fade in + rise
 *  750ms   "the plaza" meta block fades in from the right
 * ───────────────────────────────────────────────────────── */
function Hero() {
  const [stage, setStage] = useState(0);
  const reduceMotion = useReducedMotion();
  // Reduced-motion renders the final state immediately rather than setting
  // state synchronously inside the effect below — the timer cascade simply
  // never runs for that case.
  const displayStage = reduceMotion ? 5 : stage;

  useEffect(() => {
    if (reduceMotion) return;
    const timers = [
      setTimeout(() => setStage(1), HERO_TIMING.eyebrow),
      setTimeout(() => setStage(2), HERO_TIMING.wordmark),
      setTimeout(() => setStage(3), HERO_TIMING.image),
      setTimeout(() => setStage(4), HERO_TIMING.ctas),
      setTimeout(() => setStage(5), HERO_TIMING.meta),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    <section className="relative flex min-h-[calc(100dvh-73px)] flex-col overflow-hidden bg-app-bg">
      <div className="mx-auto w-full max-w-[1320px] px-5 pt-8 sm:px-8 sm:pt-10 lg:px-14 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: displayStage >= 1 ? 1 : 0, y: displayStage >= 1 ? 0 : -10 }}
          transition={SPRING.stiff}
          className="inline-flex flex-col gap-2"
        >
          <p className="font-mono text-[12px] font-medium uppercase leading-[1.5] tracking-[0.14em] text-ink sm:text-[20px]">
            Shopping
            <br />
            that moves
            <br />
            with you.
          </p>
          <span className="h-px w-9 bg-ink" />
        </motion.div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1320px] min-h-[260px] flex-1 items-center justify-center overflow-hidden px-5 py-4 sm:min-h-[380px] sm:px-8 lg:min-h-0 lg:px-14">
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: displayStage >= 2 ? 1 : 0, y: displayStage >= 2 ? 0 : 28 }}
          transition={SPRING.stiff}
          className="pointer-events-none select-none whitespace-nowrap text-center font-semibold leading-none tracking-tight text-ink"
          style={{ fontSize: "clamp(2.75rem, 11vw, 12.5rem)" }}
        >
          MORVA
        </motion.h1>

        <div
          className="absolute left-1/2 top-1/2 z-10 aspect-[523/1284] w-[10vw] min-w-[120px] max-w-[240px] -translate-x-1/2 -translate-y-[46%]"
          style={{ filter: "drop-shadow(0 18px 26px rgba(22,22,26,0.28))" }}
        >
          <Parallax speed={-22} className="relative h-full w-full">
            <motion.div
              initial={{ opacity: 0, y: 34, scale: 0.94 }}
              animate={{
                opacity: displayStage >= 3 ? 1 : 0,
                y: displayStage >= 3 ? 0 : 34,
                scale: displayStage >= 3 ? 1 : 0.94,
              }}
              transition={SPRING.bouncy}
              className="relative h-full w-full"
            >
              <FloatIdle seed={2} className="relative h-full w-full">
                <Image
                  src="/hero-photos/model-tote-cutout-523x1284.png"
                  alt="A Morva shopper carrying a tote bag from the plaza"
                  fill
                  sizes="240px"
                  quality={80}
                  priority
                  className="object-contain object-bottom"
                />
              </FloatIdle>
            </motion.div>
          </Parallax>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-5 pb-8 pt-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-8 sm:px-8 sm:pb-10 lg:px-14 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: displayStage >= 4 ? 1 : 0, y: displayStage >= 4 ? 0 : 18 }}
          transition={SPRING.stiff}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
        >
          <ProtectedCta href="/plaza" variant="dark" className="w-full justify-center px-7 py-4 text-[15px] uppercase tracking-[0.04em] sm:w-auto">
            Shop now
          </ProtectedCta>
          <ProtectedCta href="/merchant/onboarding" variant="ghost" className="w-full justify-center px-6 py-4 text-[15px] uppercase tracking-[0.04em] sm:w-auto">
            Open your stall
            <ArrowRight size={16} strokeWidth={1.8} />
          </ProtectedCta>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: displayStage >= 5 ? 1 : 0, x: displayStage >= 5 ? 0 : 18 }}
          transition={SPRING.stiff}
          className="flex flex-col items-start gap-2 text-left sm:items-end sm:text-right"
        >
          <p className="font-mono text-[12px] font-medium uppercase leading-[1.5] tracking-[0.14em] text-ink sm:text-[13px]">
            The plaza
            <br />
            {STALLS.length}+ stalls open
          </p>
          <span className="h-px w-9 bg-ink" />
        </motion.div>
      </div>
    </section>
  );
}

function TrustMarquee() {
  const names = STALLS.map((stall) => stall.name);
  const loop = [...names, ...names];

  return (
    <div className="overflow-hidden border-y border-border-soft py-7">
      <div
        className="flex w-max gap-16 pl-8"
        style={{ animation: "morva-marquee 26s linear infinite" }}
      >
        {loop.map((name, i) => (
          <span key={i} className="text-[18px] font-semibold text-ink-quiet">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Thesis() {
  return (
    <section className="mx-auto max-w-[820px] px-5 pb-16 pt-20 text-center sm:px-8 sm:pt-24">
      <ScrollReveal variant="up">
        <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-quiet">
          The whole idea
        </p>
        <h2 className="mt-4 text-[32px] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[42px]">
          The best crypto experience is the one you never notice.
        </h2>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-ink-soft sm:text-[18px]">
          Your money can live across a dozen networks. Morva treats it as one
          balance and settles the rest in the background — so buying is just
          buying.
        </p>
      </ScrollReveal>
    </section>
  );
}

const FEATURE_VARIANTS: ScrollRevealVariant[] = ["left", "up", "right"];

function FeatureTriptych() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 lg:px-14">
      <div className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <ScrollReveal key={feature.title} variant={FEATURE_VARIANTS[i % 3]} index={i} className="h-full">
            <div className="h-full rounded-[28px] border border-border-soft bg-surface-solid p-8 transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:rotate-[0.4deg] motion-safe:hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
              <div className={`flex h-[50px] w-[50px] items-center justify-center rounded-2xl ${feature.accent}`}>
                <feature.icon size={23} strokeWidth={1.7} />
              </div>
              <p className="mt-6 text-[21px] font-semibold tracking-tight text-ink">{feature.title}</p>
              <p className="mt-2.5 text-[15px] leading-[1.55] text-ink-soft">{feature.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function PlazaPreview({ big, rest }: { big: Stall; rest: Stall[] }) {
  const bigAccent = accentClasses(big.accent);

  const smallVariants: ScrollRevealVariant[] = ["left", "right", "left", "right"];

  return (
    <section id="plaza-preview" className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 lg:px-14">
      <ScrollReveal variant="up">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-quiet">The plaza</p>
            <h2 className="mt-3.5 text-[32px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[38px]">
              A market with real character.
            </h2>
          </div>
          <Link
            href="/plaza"
            className="flex items-center gap-2 text-[15px] font-semibold text-ink transition-colors hover:text-primary"
          >
            Wander the plaza
            <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ScrollReveal variant="converge" index={0} className="h-full sm:col-span-2">
          <Link
            href={`/stalls/${big.slug}`}
            className={`relative flex min-h-[320px] items-center overflow-hidden rounded-[30px] transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.015] motion-safe:hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] ${bigAccent.bg}`}
          >
            <div className="z-10 max-w-[300px] p-9">
              <AvatarTile label={big.initial} accent={big.accent} size="xl" className="bg-surface-solid" />
              <p className={`mt-4 text-[25px] font-semibold ${bigAccent.fg}`}>{big.name}</p>
              <p className={`mt-1.5 text-[15px] leading-[1.5] opacity-80 ${bigAccent.fg}`}>{big.description}</p>
              <span className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white">
                Visit stall
              </span>
            </div>
            <MediaImage
              src={big.photoUrl}
              alt={big.name}
              sizes="(min-width: 1024px) 66vw, 100vw"
              aspectRatio="1 / 1"
              className="absolute inset-y-0 right-0 h-full w-3/5"
            />
          </Link>
        </ScrollReveal>

        {rest.map((stall, i) => {
          const accent = accentClasses(stall.accent);
          return (
            <ScrollReveal key={stall.id} variant={smallVariants[i % smallVariants.length]} index={i + 1} className="h-full">
              <Link
                href={`/stalls/${stall.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-[30px] border border-border-soft bg-surface-solid transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:rotate-[0.4deg] motion-safe:hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
              >
                <MediaImage
                  src={stall.photoUrl}
                  alt={stall.name}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className={`h-[190px] ${accent.bg}`}
                />
                <div className="p-[22px]">
                  <p className={`text-[19px] font-semibold ${accent.fg}`}>{stall.name}</p>
                  <p className="mt-1 text-[14px] text-ink-faint">{stall.tagline}</p>
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}

const STEP_VARIANTS: ScrollRevealVariant[] = ["left", "up", "right"];

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:px-14">
      <ScrollReveal variant="up">
        <div className="mb-12 text-center">
          <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-quiet">How it works</p>
          <h2 className="mt-3.5 text-[32px] font-semibold tracking-tight text-ink sm:text-[38px]">
            Three taps, start to finish.
          </h2>
        </div>
      </ScrollReveal>
      <div className="grid gap-10 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <ScrollReveal key={step.title} variant={STEP_VARIANTS[i % 3]} index={i}>
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-[#C9D6FF] font-mono text-[14px] text-primary">
                  {i + 1}
                </span>
                <div className="h-px flex-1 bg-border-soft" />
              </div>
              <p className="mt-5 text-[21px] font-semibold tracking-tight text-ink">{step.title}</p>
              <p className="mt-2 text-[15px] leading-[1.55] text-ink-soft">{step.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function MerchantBand() {
  const preview = getStallBySlug("golden-hour-bakery");

  return (
    <section id="for-sellers" className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 lg:px-14">
      <ScrollReveal variant="up">
        <div className="grid gap-10 overflow-hidden rounded-[36px] bg-ink p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-12 lg:p-16">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-quiet">For sellers</p>
            <h2 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[40px]">
              Open a stall in minutes. Get paid in what you want.
            </h2>
            <p className="mt-4 max-w-[440px] text-[16px] leading-[1.55] text-ink-quiet">
              Name it, pick your color, choose where the money lands. Buyers pay
              however they like — you settle in the token you chose,
              automatically, every time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ProtectedCta href="/merchant/onboarding" className="px-7 py-4 text-[16px]">
                Open your stall
              </ProtectedCta>
              <Link
                href="/merchant/dashboard"
                className="flex items-center gap-2 text-[15px] font-semibold text-white"
              >
                Preview seller tools
                <ArrowRight size={16} strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          {preview && (
            <Parallax speed={-14}>
              <div className="overflow-hidden rounded-[26px] bg-surface-solid">
                <MediaImage src={preview.photoUrl} alt={preview.name} sizes="400px" aspectRatio="16 / 9" />
                <div className="flex items-center gap-3 p-5">
                  <AvatarTile label={preview.initial} accent={preview.accent} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-ink">{preview.name}</p>
                    <p className="truncate text-[13px] text-ink-faint">{preview.tagline}</p>
                  </div>
                  <span className="flex-none rounded-full bg-success-bg px-3 py-1.5 text-[12px] font-semibold text-success-fg">
                    Live
                  </span>
                </div>
              </div>
            </Parallax>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-[820px] px-5 py-24 text-center sm:px-8">
      <ScrollReveal variant="up">
        <h2 className="text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[54px]">
          Come see what&apos;s
          <br />
          at the plaza today.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <ProtectedCta href="/plaza" className="px-8 py-4 text-[17px]">
            Start shopping
          </ProtectedCta>
          <ProtectedCta href="/merchant/onboarding" variant="ghost" className="px-7 py-4 text-[17px]">
            Open your stall
          </ProtectedCta>
        </div>
      </ScrollReveal>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border-soft">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-5 py-12 sm:flex-row sm:justify-between sm:px-8 lg:px-14">
        <div className="max-w-[280px]">
          <Link href="/" className="flex items-center gap-[10px]">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-ink text-[15px] font-semibold text-white">
              M
            </div>
            <span className="text-[18px] font-semibold tracking-tight text-ink">Morva</span>
          </Link>
          <p className="mt-3.5 text-[14px] leading-[1.55] text-ink-faint">
            A plaza where crypto stays out of the way. One balance, every
            stall.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-16">
          <FooterColumn
            title="Shop"
            links={[
              { label: "The Plaza", href: "/plaza" },
              { label: "Explore", href: "/explore" },
              { label: "Categories", href: "/categories" },
            ]}
          />
          <FooterColumn
            title="Sell"
            links={[
              { label: "Open a stall", href: "/merchant/onboarding" },
              { label: "Your stall", href: "/merchant/dashboard" },
              { label: "Payments", href: "/merchant/payments" },
            ]}
          />
          <FooterColumn
            title="Developers"
            links={[
              { label: "SDK docs", href: "/sdk" },
              { label: "GitHub", href: GITHUB_URL, external: true },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-border-soft px-5 py-5 text-[13px] text-ink-quiet sm:px-8 lg:px-14">
        © 2026 Morva. Made for people who just want to buy the thing.
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold text-ink-quiet">{title}</p>
      {links.map((link) =>
        link.external ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[14px] text-ink-soft transition-colors hover:text-ink"
          >
            {link.label}
            <ArrowUpRight size={13} strokeWidth={1.8} />
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className="text-[14px] text-ink-soft transition-colors hover:text-ink"
          >
            {link.label}
          </Link>
        )
      )}
    </div>
  );
}
