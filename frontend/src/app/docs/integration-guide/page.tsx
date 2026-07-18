import Link from "next/link";
import { H1, Lead, H2, P, UL, LI, OL, Step, InlineCode, Callout } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";

export default function IntegrationGuidePage() {
  return (
    <div>
      <H1>Integration guide</H1>
      <Lead>
        A full walkthrough for wiring @morva/sdk into your own platform —
        your own merchant onboarding, your own buyer auth, your own
        checkout UI. This is the path from &quot;the SDK exists&quot; to
        &quot;a real buyer paid a real merchant through it.&quot;
      </Lead>

      <H2 id="prerequisites">Before you start</H2>
      <UL>
        <LI>A Particle Network project (Project ID, Client Key, App ID) — see <Link href="/docs/quickstart#particle-project" className="font-semibold text-ink underline underline-offset-2">the quickstart</Link>.</LI>
        <LI>An embedded wallet provider your users already authenticate with, that can produce EIP-7702 authorization signatures (Magic is proven in this repo; see <Link href="/docs/infrastructure#magic" className="font-semibold text-ink underline underline-offset-2">why injected wallets don&apos;t work here</Link>). If you don&apos;t have one yet, Magic is the fastest path — its embedded wallet natively supports <InlineCode>sign7702Authorization</InlineCode>.</LI>
        <LI>A decision on <Link href="/docs/concepts#payment-intent" className="font-semibold text-ink underline underline-offset-2">direct vs. registry-based</Link> merchant settlement config — most integrations start with direct.</LI>
      </UL>

      <H2 id="steps">The integration, step by step</H2>
      <OL>
        <Step n={1} title="Install and configure">
          <CodeBlock code={`pnpm add @morva/sdk`} />
          <P>
            Create one <InlineCode>Morva</InlineCode> instance for your app
            — not per-request, not per-component. It&apos;s stateless
            beyond holding config, so a module-level singleton is normal:
          </P>
          <CodeBlock
            code={`// lib/morva.ts
import { createMorva } from "@morva/sdk";

export const morva = createMorva({
  particle: {
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
  },
  // registryAddress: "0x...", // add once/if you deploy MorvaRegistry
});`}
          />
        </Step>

        <Step n={2} title="Store where each merchant gets paid">
          <P>
            Whatever your merchant onboarding flow looks like, the two
            fields <InlineCode>createDirectIntent</InlineCode> needs are a{" "}
            <InlineCode>settlementToken</InlineCode> (the ERC-20 contract
            address on Arbitrum One) and a{" "}
            <InlineCode>settlementRecipient</InlineCode> (where funds land).
            Store these however you already store merchant data — a
            database row is the common case. There&apos;s no SDK call
            required to &quot;register&quot; a merchant on this path; the
            settlement config only needs to exist by the time a buyer
            checks out.
          </P>
          <Callout title="Using the registry instead?">
            <P>
              Skip straight to <InlineCode>morva.registerMerchant(cfg, walletClient)</InlineCode> —
              it needs a viem <InlineCode>WalletClient</InlineCode> for the
              merchant&apos;s own wallet, since registering writes an
              on-chain transaction the merchant signs themselves. See the{" "}
              <Link href="/docs/api-reference#registermerchant" className="font-semibold text-ink underline underline-offset-2">
                API reference
              </Link>
              .
            </P>
          </Callout>
        </Step>

        <Step n={3} title="Build a signer for your buyer's wallet" >
          <P id="signer">
            This is the piece unique to your stack — implement{" "}
            <InlineCode>MorvaSigner</InlineCode> against whatever embedded
            wallet provider your app already uses for buyer auth. Here&apos;s
            the complete, working Magic implementation from this
            repo&apos;s reference frontend:
          </P>
          <CodeBlock
            code={`import type { Magic } from "magic-sdk";
import { createWalletClient, custom, type Address, type Hex, type SignedAuthorization } from "viem";
import type { AuthorizationRequest, MorvaSigner } from "@morva/sdk";

export class MagicSigner implements MorvaSigner {
  constructor(
    private readonly magic: Magic,
    public readonly address: Address
  ) {}

  async signMessage(message: Uint8Array): Promise<Hex> {
    const walletClient = createWalletClient({
      account: this.address,
      transport: custom(this.magic.rpcProvider),
    });
    return walletClient.signMessage({ account: this.address, message: { raw: message } });
  }

  async signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization> {
    const signed = await this.magic.wallet.sign7702Authorization({
      contractAddress: auth.contractAddress,
      chainId: auth.chainId,
      nonce: auth.nonce,
    });
    return {
      address: signed.contractAddress as Address,
      chainId: signed.chainId,
      nonce: signed.nonce,
      r: signed.r as Hex,
      s: signed.s as Hex,
      yParity: signed.v >= 27 ? signed.v - 27 : signed.v,
    };
  }
}`}
          />
          <P>
            If you&apos;re on a different embedded wallet provider, look for
            the equivalent two capabilities: raw message signing (usually{" "}
            <InlineCode>personal_sign</InlineCode> under the hood) and
            native EIP-7702 authorization signing. Most embedded providers
            with 7702 support expose both directly.
          </P>
        </Step>

        <Step n={4} title="Connect the buyer when they reach checkout">
          <CodeBlock
            code={`import { morva } from "@/lib/morva";
import { MagicSigner } from "@/lib/magic-signer";

const signer = new MagicSigner(magic, buyerAddress);
const session = await morva.connect(signer);

const balance = await session.getUnifiedBalance();
// balance.totalUsd — show this before the buyer commits to paying`}
          />
          <P>
            Do this at checkout time, not at sign-in — constructing the
            Universal Account is cheap, but there&apos;s no reason to do it
            before a buyer actually needs to pay.
          </P>
        </Step>

        <Step n={5} title="Build the intent and pay">
          <CodeBlock
            code={`const intent = morva.createDirectIntent({
  amount: order.totalUsd.toFixed(2),
  orderId: order.id,
  settlementToken: merchant.settlementToken,
  settlementRecipient: merchant.settlementRecipient,
});

try {
  const result = await session.pay(intent, {
    onStatus: (status) => setCheckoutStatus(status), // drive your UI off this
  });
  await markOrderSettled(order.id, result.transactionId, result.explorerUrl);
} catch (err) {
  await markOrderFailed(order.id, err instanceof Error ? err.message : "Unknown error");
  // see the errors reference for handling each typed error distinctly
}`}
          />
          <Callout tone="warning" title="Amount precision">
            <P>
              <InlineCode>amount</InlineCode> is a plain decimal string sent
              straight through to the settlement token&apos;s own transfer —
              in the token&apos;s units, not necessarily USD (only true for
              USDC and other 1:1 stablecoins; settling in ETH, WETH, or any
              other ERC-20 means <InlineCode>amount</InlineCode> is in that
              token&apos;s units instead).{" "}
              <InlineCode>.toFixed(2)</InlineCode> silently rounds anything
              under a cent to <InlineCode>&quot;0.00&quot;</InlineCode> —
              indistinguishable from a real bug, since{" "}
              <InlineCode>pay()</InlineCode> will happily execute a genuine
              zero-value transfer. Use enough decimal places that a real
              price never rounds to zero — match the settlement
              token&apos;s own decimals (6 for USDC, typically 18 for ETH
              and most other ERC-20s).
            </P>
          </Callout>
          <P>
            Record the order as <em>pending</em> before calling{" "}
            <InlineCode>pay()</InlineCode>, not after — if your process
            crashes mid-payment, you want a record that a payment was
            attempted, not silence. Re-read prices from your own database
            inside that pending-order step too; never trust a price the
            client sent you.
          </P>
        </Step>

        <Step n={6} title="Surface the transaction, not just success">
          <P>
            <InlineCode>result.transactionId</InlineCode> and{" "}
            <InlineCode>result.explorerUrl</InlineCode> are what let a buyer
            (or you, debugging a support ticket) independently verify a
            payment actually happened. Show the explorer link on your order
            confirmation screen — don&apos;t just show a checkmark and
            discard the only proof the payment is real.
          </P>
        </Step>
      </OL>

      <H2 id="testing">Testing before you rely on this with real money</H2>
      <P>
        <InlineCode>LocalSigner</InlineCode> (a raw private key,
        never for a real frontend) is what the SDK&apos;s own test suite and
        end-to-end script use. If you&apos;re integration-testing your own
        checkout flow without a browser, it&apos;s the fastest way to drive
        a real <InlineCode>session.pay()</InlineCode> call:
      </P>
      <CodeBlock
        code={`import { createMorva, LocalSigner } from "@morva/sdk";

const signer = new LocalSigner(process.env.TEST_BUYER_KEY! as \`0x\${string}\`);
const session = await morva.connect(signer);
// same session.pay() call as production — just funded with real testnet-adjacent value`}
      />
      <Callout tone="warning" title="This still moves real funds">
        <P>
          There is no sandbox/testnet mode for the payment execution path —
          <InlineCode>session.pay()</InlineCode> always executes against
          real Particle infrastructure and real chain state. Test with a
          small, deliberately funded key, and confirm one real payment
          end-to-end (checking the explorer link, not just that{" "}
          <InlineCode>pay()</InlineCode> resolved) before shipping.
        </P>
      </Callout>

      <H2 id="checklist">Before you ship</H2>
      <UL>
        <LI>Confirm your <InlineCode>MorvaSigner</InlineCode> implementation never has access to a raw private key — only your embedded provider&apos;s own signing methods.</LI>
        <LI>Re-read prices/settlement config from your own trusted storage at payment time — never from client input.</LI>
        <LI>Record orders as pending before calling <InlineCode>pay()</InlineCode>, and settled/failed after, so a crash mid-payment doesn&apos;t leave you with no record. A <InlineCode>SettlementTimeout</InlineCode> is neither — leave the order pending, don&apos;t mark it failed, see the next item.</LI>
        <LI>Catch <InlineCode>MorvaSdkError</InlineCode> specifically (see the <Link href="/docs/errors" className="font-semibold text-ink underline underline-offset-2">errors reference</Link>) and handle <InlineCode>InsufficientUnifiedBalance</InlineCode>/<InlineCode>UnroutableBalance</InlineCode> and <InlineCode>SettlementTimeout</InlineCode> as distinct, expected outcomes — not generic failures. On <InlineCode>SettlementTimeout</InlineCode>, store <InlineCode>err.transactionId</InlineCode> and pass it back in as <InlineCode>resumeTransactionId</InlineCode> on retry — otherwise a retry submits a second transfer, and a buyer whose first payment does land gets charged twice.</LI>
        <LI>Show the transaction explorer link somewhere the buyer can actually find it after paying.</LI>
      </UL>
    </div>
  );
}
