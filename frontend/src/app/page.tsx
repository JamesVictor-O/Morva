import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowUpRight, CheckCircle2, Wallet, Zap } from "lucide-react";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { MediaImage } from "@/components/ui/media-image";
import { accentClasses } from "@/components/ui/accent";
import { HeaderAuthActions } from "@/components/auth/header-auth-actions";
import { ProtectedCta } from "@/components/auth/protected-cta";
import { PRODUCTS, STALLS, UNIFIED_BALANCE, getFeaturedStall, getStallBySlug } from "@/lib/mock-data";
import type { Stall } from "@/lib/types";

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
  const featured = getFeaturedStall();
  const featuredProduct = PRODUCTS.find((product) => product.stallId === featured.id);
  const previewStalls = PREVIEW_SLUGS.map((slug) => getStallBySlug(slug)).filter((s): s is Stall => Boolean(s));
  const [bigPreview, ...restPreview] = previewStalls;

  return (
    <div className="bg-app-bg">
      <SiteHeader />

      <main>
        <Hero featured={featured} featuredProduct={featuredProduct} />
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

function Hero({ featured, featuredProduct }: { featured: Stall; featuredProduct?: (typeof PRODUCTS)[number] }) {
  const { bg, fg } = accentClasses(featured.accent);

  return (
    <section className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-14 lg:pb-20 lg:pt-24">
      <div>
        <div className="inline-flex items-center gap-2.5 rounded-full border border-border-soft bg-surface-solid px-4 py-1.5 text-[13px] text-ink-soft">
          <span className="h-[7px] w-[7px] rounded-full bg-success-fg" />
          One balance. Every stall. Zero crypto in your way.
        </div>
        <h1 className="mt-6 text-[44px] font-semibold leading-[1.04] tracking-tight text-ink sm:text-[58px] lg:text-[68px]">
          Shopping that just
          <br />
          happens to run
          <br />
          on crypto.
        </h1>
        <p className="mt-6 max-w-[500px] text-[17px] leading-[1.55] text-ink-soft sm:text-[19px]">
          Morva is a plaza of independent stalls. Browse, tap buy, pay from one
          balance. No chains, no gas, no wallets to wrangle — it feels like any
          shop you already love.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ProtectedCta href="/plaza" className="px-7 py-4 text-[16px]">
            Start shopping
          </ProtectedCta>
          <ProtectedCta href="/merchant/onboarding" variant="ghost" className="px-6 py-4 text-[16px]">
            Open your stall
            <ArrowRight size={17} strokeWidth={1.8} />
          </ProtectedCta>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-6 sm:gap-8">
          <Stat value={`${STALLS.length}+`} label="stalls open" />
          <div className="hidden h-9 w-px bg-border sm:block" />
          <Stat value="One tap" label="to check out" />
          <div className="hidden h-9 w-px bg-border sm:block" />
          <Stat value="$0" label="gas, ever" />
        </div>
      </div>

      <div className="relative h-[420px] sm:h-[480px] lg:h-[540px]">
        <div className={`absolute inset-0 overflow-hidden rounded-[32px] ${bg}`}>
          <MediaImage
            src={featured.photoUrl}
            alt={featured.name}
            sizes="(min-width: 1024px) 45vw, 100vw"
            aspectRatio="1 / 1"
            priority
            className="absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          <div className="absolute left-6 top-6 flex items-center gap-3">
            <AvatarTile label={featured.initial} accent={featured.accent} size="xl" className="bg-surface-solid" />
            <div>
              <p className={`text-[16px] font-semibold ${fg}`}>{featured.name}</p>
              <p className={`text-[13px] opacity-80 ${fg}`}>{featured.tagline}</p>
            </div>
          </div>
        </div>

        {featuredProduct && (
          <div
            className="absolute -bottom-6 -left-4 w-[300px] rounded-[24px] border border-border-soft bg-surface-solid p-6 shadow-[0_20px_60px_rgba(22,22,26,0.12)] sm:w-[326px]"
            style={{ animation: "morva-float 5s ease-in-out infinite" }}
          >
            <div className="flex items-center gap-3">
              <MediaImage
                src={featuredProduct.photoUrl}
                alt={featuredProduct.name}
                sizes="38px"
                aspectRatio="1 / 1"
                className={`w-[38px] flex-none rounded-[11px] ${bg}`}
                fallback={<AvatarTile label={featured.initial} accent={featured.accent} size="md" />}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{featuredProduct.name}</p>
                <p className="truncate text-[12px] text-ink-faint">{featured.name}</p>
              </div>
            </div>
            <p className="mt-4 text-[36px] font-semibold leading-none tracking-tight text-ink">
              ${featuredProduct.priceUsd.toFixed(2)}
            </p>
            <div className="mt-3.5 flex items-center rounded-2xl border border-border-soft px-4 py-3">
              <div className="flex-1">
                <p className="text-[12px] text-ink-soft">From your balance</p>
                <p className="text-[15px] font-semibold text-ink">${UNIFIED_BALANCE.totalUsd.toFixed(2)}</p>
              </div>
              <span className="rounded-full bg-fill px-2.5 py-1 text-[11px] text-ink-faint">
                {UNIFIED_BALANCE.chains.length} networks ⌄
              </span>
            </div>
            <div className="mt-3.5 w-full rounded-full bg-primary py-3 text-center text-[15px] font-semibold text-primary-ink">
              Pay ${featuredProduct.priceUsd.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[24px] font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-[13px] text-ink-faint">{label}</div>
    </div>
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
    </section>
  );
}

function FeatureTriptych() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 lg:px-14">
      <div className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-[28px] border border-border-soft bg-surface-solid p-8"
          >
            <div className={`flex h-[50px] w-[50px] items-center justify-center rounded-2xl ${feature.accent}`}>
              <feature.icon size={23} strokeWidth={1.7} />
            </div>
            <p className="mt-6 text-[21px] font-semibold tracking-tight text-ink">{feature.title}</p>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-ink-soft">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlazaPreview({ big, rest }: { big: Stall; rest: Stall[] }) {
  const bigAccent = accentClasses(big.accent);

  return (
    <section id="plaza-preview" className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 lg:px-14">
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/stalls/${big.slug}`}
          className={`relative flex min-h-[320px] items-center overflow-hidden rounded-[30px] sm:col-span-2 ${bigAccent.bg}`}
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

        {rest.map((stall) => {
          const accent = accentClasses(stall.accent);
          return (
            <Link
              key={stall.id}
              href={`/stalls/${stall.slug}`}
              className="flex flex-col overflow-hidden rounded-[30px] border border-border-soft bg-surface-solid transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
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
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:px-14">
      <div className="mb-12 text-center">
        <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-quiet">How it works</p>
        <h2 className="mt-3.5 text-[32px] font-semibold tracking-tight text-ink sm:text-[38px]">
          Three taps, start to finish.
        </h2>
      </div>
      <div className="grid gap-10 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title}>
            <div className="flex items-center gap-3">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-[#C9D6FF] font-mono text-[14px] text-primary">
                {i + 1}
              </span>
              <div className="h-px flex-1 bg-border-soft" />
            </div>
            <p className="mt-5 text-[21px] font-semibold tracking-tight text-ink">{step.title}</p>
            <p className="mt-2 text-[15px] leading-[1.55] text-ink-soft">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MerchantBand() {
  const preview = getStallBySlug("golden-hour-bakery");

  return (
    <section id="for-sellers" className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 lg:px-14">
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
        )}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-[820px] px-5 py-24 text-center sm:px-8">
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
