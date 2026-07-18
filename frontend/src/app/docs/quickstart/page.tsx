import Link from "next/link";
import { H1, Lead, H2, P, Callout, InlineCode } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";
import { CopyChip } from "@/components/sdk/copy-chip";

export default function QuickstartPage() {
  return (
    <div>
      <H1>Quickstart</H1>
      <Lead>
        The fastest path to a working payment — no on-chain registry, no
        merchant registration step. Good for prototyping and for merchants
        who&apos;d rather store settlement config themselves than register
        on-chain.
      </Lead>

      <H2 id="install">1. Install</H2>
      <P>Requires no peer dependencies beyond what&apos;s already bundled (viem, the pinned Particle Universal Account SDK).</P>
      <div className="mt-4">
        <CopyChip text="pnpm add @morva/sdk" />
      </div>

      <H2 id="particle-project">2. Get a Particle project</H2>
      <P>
        Universal Accounts are how the SDK reads a buyer&apos;s cross-chain
        balance and constructs the transfer. Create a project at{" "}
        <a
          href="https://dashboard.particle.network"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-ink underline underline-offset-2"
        >
          dashboard.particle.network
        </a>{" "}
        and grab three values: Project ID, Client Key, and an App ID (the
        App ID lives one level under the project — inside a specific Web/iOS/
        Android application you create there, not on the project overview
        page itself).
      </P>

      <H2 id="signer">3. Build a signer</H2>
      <P>
        The SDK never touches a private key directly — it needs an object
        implementing <InlineCode>MorvaSigner</InlineCode>, which can sign
        messages and produce EIP-7702 authorizations. For scripts and tests,
        use the bundled <InlineCode>LocalSigner</InlineCode>:
      </P>
      <CodeBlock
        className="mt-4"
        code={`import { LocalSigner } from "@morva/sdk";

const signer = new LocalSigner(process.env.BUYER_PRIVATE_KEY! as \`0x\${string}\`);`}
      />
      <Callout title="For a real frontend, don't use LocalSigner">
        <P>
          A raw private key has no place in browser JS. Real integrations
          implement <InlineCode>MorvaSigner</InlineCode> against an embedded
          wallet provider instead — see{" "}
          <Link href="/docs/integration-guide#signer" className="font-semibold text-ink underline underline-offset-2">
            building a signer
          </Link>{" "}
          in the integration guide for a complete Magic-backed example.
        </P>
      </Callout>

      <H2 id="pay">4. Build an intent and pay</H2>
      <P>
        A <InlineCode>PaymentIntent</InlineCode> is a plain description of
        what&apos;s being paid — amount, settlement token, settlement
        recipient. <InlineCode>createDirectIntent</InlineCode> builds one
        synchronously, no network call:
      </P>
      <CodeBlock
        className="mt-4"
        code={`import { createMorva } from "@morva/sdk";

const morva = createMorva({
  particle: {
    projectId: process.env.PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.PARTICLE_APP_UUID!,
  },
});

const session = await morva.connect(signer);

const intent = morva.createDirectIntent({
  amount: "4.99",
  orderId: "order-123",
  settlementToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // native USDC, Arbitrum One
  settlementRecipient: "0xYourMerchantAddress",
});

const result = await session.pay(intent, {
  onStatus: (status) => console.log(status),
});

console.log(result.transactionId, result.explorerUrl);`}
      />
      <P>
        <InlineCode>session.pay()</InlineCode> resolves once funds are
        confirmed at <InlineCode>settlementRecipient</InlineCode> on the
        intent&apos;s settlement chain (Arbitrum One here, since{" "}
        <InlineCode>settlementChainId</InlineCode> wasn&apos;t set above), or
        throws one of the typed errors documented on the{" "}
        <Link href="/docs/errors" className="font-semibold text-ink underline underline-offset-2">
          errors page
        </Link>
        . <InlineCode>onStatus</InlineCode> reports{" "}
        <InlineCode>building → authorizing → signing → submitted → settled</InlineCode>{" "}
        (or <InlineCode>failed</InlineCode>) as the payment progresses — see{" "}
        <Link href="/docs/concepts#status" className="font-semibold text-ink underline underline-offset-2">
          the status lifecycle
        </Link>{" "}
        for what each stage means.
      </P>

      <H2 id="next">Next</H2>
      <P>
        That&apos;s a full payment. For how the pieces underneath it actually
        work — and why they were chosen — read{" "}
        <Link href="/docs/infrastructure" className="font-semibold text-ink underline underline-offset-2">
          the infrastructure page
        </Link>
        . To wire this into a real product with a real merchant onboarding
        flow and a real buyer wallet, read the{" "}
        <Link href="/docs/integration-guide" className="font-semibold text-ink underline underline-offset-2">
          integration guide
        </Link>
        .
      </P>
    </div>
  );
}
