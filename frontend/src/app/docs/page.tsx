import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { H1, Lead, H2, P, UL, LI, InlineCode } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";

export default function DocsIntroductionPage() {
  return (
    <div>
      <H1>Introduction</H1>
      <Lead>
        @morva/sdk is a headless TypeScript payment engine: it accepts crypto
        payments settled in a merchant&apos;s chosen token on Arbitrum One,
        while the buyer pays from a single balance spread across whatever
        chains they actually hold assets on. This section walks through what
        it does, how it&apos;s built, and how to put it into your own
        platform.
      </Lead>

      <H2 id="the-problem">The problem</H2>
      <P>
        A buyer&apos;s crypto is rarely in one place. Some USDC on Base, a
        little ETH on Arbitrum, maybe something on Polygon from an old
        airdrop. Every existing checkout flow forces the buyer to solve that
        fragmentation themselves — pick a chain, bridge if the funds aren&apos;t
        there, approve, swap, and only then pay. Most people abandon the cart
        before finishing that sequence.
      </P>
      <P>
        Merchants have the opposite problem: they want to receive one
        specific token, on one specific chain, every time — not a
        different asset from every buyer that they then have to manage,
        swap, or bridge themselves.
      </P>
      <P>
        Morva sits between the two. The buyer signs once. The merchant
        receives exactly what they configured, every time, regardless of
        what the buyer actually held.
      </P>

      <H2 id="how">How it actually works</H2>
      <P>
        This isn&apos;t a custodial middle step — Morva never holds funds.
        Three pieces of existing infrastructure do the real work, and the SDK
        is the layer that wires them together for a payment flow specifically:
      </P>
      <UL>
        <LI>
          <strong className="text-ink">Particle Network&apos;s Universal Accounts</strong>,
          in <InlineCode>EIP-7702</InlineCode> mode, upgrade the buyer&apos;s
          own EOA in place into a chain-abstracted account — no new address,
          no deposit step — and handle reading the buyer&apos;s balance across
          chains and routing liquidity to the settlement chain.
        </LI>
        <LI>
          <strong className="text-ink">An embedded wallet provider</strong>{" "}
          (Magic in the reference frontend; any provider that can produce
          EIP-7702 authorization signatures works) is what the buyer actually
          authenticates with and signs through — the SDK never sees or
          touches a private key.
        </LI>
        <LI>
          <strong className="text-ink">Arbitrum One</strong> is the fixed
          settlement chain. Whatever the buyer holds and wherever they hold
          it, the merchant&apos;s configured token lands there.
        </LI>
      </UL>
      <P>
        The <Link href="/docs/infrastructure" className="font-semibold text-ink underline underline-offset-2">infrastructure page</Link>{" "}
        goes deep on why each piece was chosen and exactly how the SDK talks
        to it. If you just want to see it work first, jump to the quickstart.
      </P>

      <H2 id="shape">The shape of an integration</H2>
      <P>
        Five calls cover the entire buyer-facing flow — no React, no UI, no
        wallet-connect modal. You bring the signer (an embedded wallet
        integration, or a raw key for scripts/tests) and the UI; the SDK
        handles the payment mechanics.
      </P>
      <CodeBlock
        className="mt-6"
        code={`import { createMorva } from "@morva/sdk";

const morva = createMorva({ particle: { projectId, projectClientKey, projectAppUuid } });
const session = await morva.connect(signer);

const intent = morva.createDirectIntent({
  amount: "4.99",
  orderId: "order-123",
  settlementToken: "0xaf88…e5831", // USDC, Arbitrum One
  settlementRecipient: "0xYourMerchantAddress",
});

const result = await session.pay(intent, { onStatus: console.log });`}
      />

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/docs/quickstart"
          className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Quickstart
          <ArrowRight size={15} strokeWidth={2} />
        </Link>
        <Link
          href="/docs/infrastructure"
          className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-fill"
        >
          How the infrastructure works
        </Link>
      </div>
    </div>
  );
}
