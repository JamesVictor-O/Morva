import Link from "next/link";
import { H1, Lead, H2, H3, P, UL, LI, InlineCode, Table, Callout } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";

export default function ConceptsPage() {
  return (
    <div>
      <H1>Core concepts</H1>
      <Lead>
        Four things to understand before integrating: the entry point, the
        connected buyer, the thing being paid for, and who&apos;s allowed to
        sign for it.
      </Lead>

      <H2 id="morva">Morva</H2>
      <P>
        <InlineCode>createMorva(config)</InlineCode> is the entry point —
        one instance per app, not per request. It holds your Particle
        credentials and (optionally) a registry address, and exposes both
        the merchant-facing registry calls and{" "}
        <InlineCode>connect()</InlineCode> for buyers.
      </P>
      <CodeBlock
        className="mt-4"
        code={`const morva = createMorva({
  particle: { projectId, projectClientKey, projectAppUuid },
  registryAddress: "0x...", // optional — see "Direct vs registry intents" below
});`}
      />

      <H2 id="buyer-session">BuyerSession</H2>
      <P>
        <InlineCode>morva.connect(signer)</InlineCode> returns a{" "}
        <InlineCode>BuyerSession</InlineCode> — a Particle Universal Account
        (EIP-7702 mode) paired with the signer that authorizes it. This is
        the buyer, connected. Two methods:
      </P>
      <UL>
        <LI>
          <InlineCode>session.getUnifiedBalance()</InlineCode> — the buyer&apos;s
          real cross-chain balance, read live.
        </LI>
        <LI>
          <InlineCode>session.pay(intent, {"{"} onStatus {"}"})</InlineCode> —
          executes a payment against a <InlineCode>PaymentIntent</InlineCode>.
        </LI>
      </UL>
      <P>Nothing about connecting a session touches the network beyond constructing the account object — the actual balance read and payment happen on their own calls.</P>

      <H2 id="payment-intent">PaymentIntent</H2>
      <P>
        A plain description of what&apos;s being paid: amount, settlement
        token, settlement recipient, and a fixed settlement chain (Arbitrum
        One — see{" "}
        <Link href="/docs/infrastructure#arbitrum" className="font-semibold text-ink underline underline-offset-2">
          why it&apos;s fixed
        </Link>
        ). Nothing about an intent is buyer-specific; it describes the sale,
        not the payer.
      </P>

      <H3>Direct vs registry intents</H3>
      <P>Two ways to build one, and they&apos;re not mutually exclusive within one app:</P>
      <Table
        head={["", "createDirectIntent", "createPaymentIntent"]}
        rows={[
          ["Needs a registry deployed", "No", "Yes"],
          ["Network call", "None — synchronous", "Reads MorvaRegistry on-chain"],
          [
            "Settlement config source",
            "Whatever you pass in directly",
            "Merchant's on-chain MerchantConfig",
          ],
          [
            "Use when",
            "You already store merchant payout config yourself (a database, for example)",
            "You want settlement config to be a public, merchant-owned on-chain record",
          ],
        ]}
      />
      <Callout title="This isn't an either/or for your whole app">
        <P>
          Most integrations use <InlineCode>createDirectIntent</InlineCode> —
          it&apos;s simpler and has one less moving part (no registry
          deployment, no merchant transaction to register). The registry
          path exists for when you want merchant settlement config to be
          self-sovereign and independently verifiable rather than something
          your backend alone controls. Nothing stops you from offering both
          and letting merchants choose.
        </P>
      </Callout>

      <H2 id="signer">MorvaSigner</H2>
      <P>The contract the SDK needs from whoever can sign for the buyer — three methods, nothing more:</P>
      <CodeBlock
        className="mt-4"
        code={`interface MorvaSigner {
  address: Address;
  signMessage(message: Uint8Array): Promise<Hex>;
  signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization>;
}`}
      />
      <P>
        <InlineCode>session.pay()</InlineCode> doesn&apos;t care how those
        three things happen — only that they do.{" "}
        <InlineCode>LocalSigner</InlineCode> (bundled) implements this over a
        raw private key, for scripts and tests only. A real frontend
        implements the same interface against an embedded wallet provider —
        walked through in full in the{" "}
        <Link href="/docs/integration-guide#signer" className="font-semibold text-ink underline underline-offset-2">
          integration guide
        </Link>
        .
      </P>
      <Callout tone="warning" title="Why not MetaMask / injected wallets?">
        <P>
          EIP-7702 mode requires producing a real EIP-7702 authorization
          signature, which standard injected JSON-RPC wallets don&apos;t
          expose a method for today. Supported signers are embedded
          providers with native 7702 support (Magic is the one proven in
          this repo) or a raw key.
        </P>
      </Callout>

      <H2 id="status">The payment status lifecycle</H2>
      <P>
        <InlineCode>session.pay(intent, {"{"} onStatus {"}"})</InlineCode> reports
        the same sequence on every payment:
      </P>
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border-soft bg-surface-solid p-5">
        {["building", "authorizing", "signing", "submitted", "settled"].map((s, i, arr) => (
          <span key={s} className="flex items-center gap-2">
            <span className="rounded-full bg-fill px-3.5 py-1.5 font-mono text-[13px] text-ink">{s}</span>
            {i < arr.length - 1 && <span className="text-ink-quiet">→</span>}
          </span>
        ))}
        <span className="ml-1 rounded-full bg-error-bg px-3.5 py-1.5 font-mono text-[13px] text-error-fg">failed</span>
      </div>
      <UL>
        <LI><strong className="text-ink">building</strong> — reading the buyer&apos;s unified balance, constructing the transfer transaction.</LI>
        <LI><strong className="text-ink">authorizing</strong> — only emitted when the buyer&apos;s EOA needs a fresh EIP-7702 delegation on a chain this payment touches; skipped silently on repeat payments once delegated.</LI>
        <LI><strong className="text-ink">signing</strong> — the buyer signs the transaction&apos;s root hash.</LI>
        <LI><strong className="text-ink">submitted</strong> — broadcast succeeded; <InlineCode>transactionId</InlineCode>/<InlineCode>explorerUrl</InlineCode> exist from here on.</LI>
        <LI><strong className="text-ink">settled</strong> — funds confirmed at <InlineCode>settlementRecipient</InlineCode> on Arbitrum One.</LI>
        <LI><strong className="text-ink">failed</strong> — <InlineCode>pay()</InlineCode> never resolves without either a settled <InlineCode>PaymentResult</InlineCode> or a thrown, typed error. See the <Link href="/docs/errors" className="font-semibold text-ink underline underline-offset-2">errors reference</Link>.</LI>
      </UL>
    </div>
  );
}
