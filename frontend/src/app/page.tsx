import Link from "next/link";
import { ArrowRight, ExternalLink, Fingerprint, Layers, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyChip } from "@/components/sdk/copy-chip";
import { CodeBlock } from "@/components/sdk/code-block";

const GITHUB_URL = "https://github.com/JamesVictor-O/Morva";

const QUICKSTART_CODE = `import { createMorva, LocalSigner } from "@morva/sdk";

const morva = createMorva({
  particle: {
    projectId: process.env.PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.PARTICLE_APP_UUID!,
  },
});

const signer = new LocalSigner(buyerPrivateKey);
const session = await morva.connect(signer);

const intent = morva.createDirectIntent({
  amount: "4.99",
  orderId: "order-123",
  settlementToken: "0xaf88…e5831", // USDC, Arbitrum One
  settlementRecipient: "0xYourMerchantAddress",
});

const result = await session.pay(intent, {
  onStatus: (status) => console.log(status),
});

console.log(result.transactionId, result.explorerUrl);`;

const STEPS = [
  {
    title: "Merchant registers once",
    body: "Settlement token and recipient address, written to MorvaRegistry on Arbitrum One. That's the whole setup.",
  },
  {
    title: "Buyer connects their own wallet",
    body: "No new address, no deposits. Their EOA is upgraded in place via EIP-7702 the first time it's needed.",
  },
  {
    title: "One signature",
    body: "A Particle Universal Account reads their balance across every supported chain and routes liquidity automatically.",
  },
  {
    title: "Merchant settles",
    body: "Exactly the token they configured, on Arbitrum One, every time — regardless of what the buyer paid with.",
  },
];

const FEATURES = [
  {
    icon: Fingerprint,
    accent: "bg-accent-purple-bg text-accent-purple-fg",
    title: "One signature",
    body: "No network switching, no bridging UI, no second approval. The buyer signs once.",
  },
  {
    icon: ShieldCheck,
    accent: "bg-accent-green-bg text-accent-green-fg",
    title: "EIP-7702, native",
    body: "The buyer's own EOA becomes the account — not a separate smart-account address to fund.",
  },
  {
    icon: Layers,
    accent: "bg-accent-slate-bg text-accent-slate-fg",
    title: "Unified balance",
    body: "Whatever the buyer holds, on whatever chain they hold it — read and spent as one balance.",
  },
  {
    icon: Target,
    accent: "bg-accent-peach-bg text-accent-peach-fg",
    title: "Fixed settlement",
    body: "The merchant always receives the exact token and chain they configured. No surprises.",
  },
];

const STATUS_STEPS = ["building", "authorizing", "signing", "submitted", "settled"];

const API_ROWS = [
  { call: "createMorva(config)", returns: "Morva", note: "Entry point." },
  { call: "morva.createDirectIntent(...)", returns: "PaymentIntent", note: "No registry needed." },
  { call: "morva.createPaymentIntent(...)", returns: "Promise<PaymentIntent>", note: "Reads config from the registry." },
  { call: "morva.connect(signer)", returns: "Promise<BuyerSession>", note: "Constructs the buyer's Universal Account." },
  { call: "session.getUnifiedBalance()", returns: "Promise<UnifiedBalance>", note: "Cross-chain holdings." },
  { call: "session.pay(intent, { onStatus })", returns: "Promise<PaymentResult>", note: "Sign → authorize → submit → settle." },
];

export default function SdkPage() {
  return (
    <div className="min-h-screen bg-app-bg">
      <header className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-semibold tracking-tight text-ink">Morva</span>
          <span className="rounded-full bg-fill px-2.5 py-0.5 font-mono text-[11px] text-ink-faint">sdk</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/docs" className="text-[14px] text-ink-soft transition-colors hover:text-ink">
            Docs
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
          >
            GitHub
            <ExternalLink size={14} strokeWidth={1.8} />
          </a>
          <Link href="/demo">
            <Button variant="dark" className="px-5 py-2.5 text-[14px]">
              View the demo
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        {/* Hero */}
        <section className="pt-10 sm:pt-16">
          <span className="rounded-full border border-border-strong bg-surface-solid px-3.5 py-1.5 font-mono text-[12px] text-ink-faint">
            @morva/sdk
          </span>
          <h1 className="mt-6 max-w-[720px] text-[38px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[52px]">
            Checkout that doesn&apos;t care which chain your buyer is holding funds on.
          </h1>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.55] text-ink-soft sm:text-[18px]">
            A headless TypeScript SDK for accepting crypto payments settled to
            one token, on one chain, of your choosing — while the buyer pays
            from a single balance spread across whatever chains they actually
            hold assets on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CopyChip text="pnpm add @morva/sdk" />
            <Link href="/demo" className="inline-flex">
              <Button variant="ghost" className="px-6 py-3.5 text-[15px]">
                See it live in the demo store
                <ArrowRight size={16} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </section>

        {/* Code sample */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            One signature. That&apos;s the integration.
          </h2>
          <p className="mt-2 max-w-[560px] text-[15px] text-ink-soft">
            No registry required to get started — build a payment intent
            directly against a known settlement token and recipient.
          </p>
          <CodeBlock code={QUICKSTART_CODE} className="mt-6" />
          <Link
            href="/docs"
            className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink transition-colors hover:text-primary"
          >
            Read the full docs
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </section>

        {/* How it works */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-[24px] border border-border-soft bg-surface-solid p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-[14px] font-medium text-white">
                  {i + 1}
                </span>
                <p className="mt-4 text-[16px] font-semibold text-ink">{step.title}</p>
                <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-faint">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Built for the payment, not the wallet
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[24px] border border-border-soft bg-surface-solid p-6"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.accent}`}>
                  <feature.icon size={20} strokeWidth={1.8} />
                </span>
                <p className="mt-4 text-[16px] font-semibold text-ink">{feature.title}</p>
                <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-faint">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Status lifecycle */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Every payment reports its own status
          </h2>
          <p className="mt-2 max-w-[560px] text-[15px] text-ink-soft">
            <code className="rounded bg-fill px-1.5 py-0.5 font-mono text-[13px]">session.pay(intent, {"{"} onStatus {"}"})</code>{" "}
            walks through the same five states on every payment.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5 rounded-[24px] border border-border-soft bg-surface-solid p-6">
            {STATUS_STEPS.map((status, i) => (
              <div key={status} className="flex items-center gap-2.5">
                <span className="rounded-full bg-fill px-4 py-2 font-mono text-[13px] text-ink">
                  {status}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <ArrowRight size={14} strokeWidth={2} className="text-ink-quiet" />
                )}
              </div>
            ))}
            <span className="ml-1 rounded-full bg-error-bg px-4 py-2 font-mono text-[13px] text-error-fg">
              failed
            </span>
          </div>
        </section>

        {/* API */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">API surface</h2>
          <div className="mt-7 overflow-hidden rounded-[24px] border border-border-soft bg-surface-solid">
            {API_ROWS.map((row, i) => (
              <div
                key={row.call}
                className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:gap-4 ${
                  i > 0 ? "border-t border-border-soft" : ""
                }`}
              >
                <code className="flex-1 font-mono text-[13.5px] text-ink">{row.call}</code>
                <code className="font-mono text-[12.5px] text-ink-faint sm:w-[220px]">{row.returns}</code>
                <span className="text-[13px] text-ink-faint sm:flex-1">{row.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-20 sm:mt-28">
          <div className="flex flex-col items-start gap-5 rounded-[28px] bg-ink p-9 sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div>
              <p className="text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
                See it running for real buyers
              </p>
              <p className="mt-1.5 max-w-[440px] text-[15px] text-white/60">
                Morva Plaza is a full demo storefront built entirely on this
                SDK — six stalls and the complete checkout experience it&apos;s
                designed around.
              </p>
            </div>
            <Link href="/demo" className="flex-none">
              <Button className="px-7 py-4 text-[15px]">
                View the demo
                <ArrowRight size={16} strokeWidth={2} />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
