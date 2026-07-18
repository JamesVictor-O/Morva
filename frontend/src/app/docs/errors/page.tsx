import { H1, Lead, H2, P, InlineCode, Table, Callout } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";

export default function ErrorsPage() {
  return (
    <div>
      <H1>Errors</H1>
      <Lead>
        Every error this SDK throws extends <InlineCode>MorvaSdkError</InlineCode>,
        so catching that one class is enough to catch anything Morva-specific.
      </Lead>

      <CodeBlock
        className="mt-6"
        code={`import { MorvaSdkError } from "@morva/sdk";

try {
  await session.pay(intent, { onStatus });
} catch (err) {
  if (err instanceof MorvaSdkError) {
    // handle by err.name / instanceof against the specific subclasses below
  }
  throw err; // don't swallow anything you don't recognize
}`}
      />

      <H2 id="reference">Error reference</H2>
      <Table
        head={["Error", "Thrown when"]}
        rows={[
          [<InlineCode key="1">MerchantNotFound</InlineCode>, "getMerchant / createPaymentIntent against an unregistered address."],
          [<InlineCode key="2">MerchantInactive</InlineCode>, "Merchant exists but called setActive(false)."],
          [<InlineCode key="3">RegistryNotConfigured</InlineCode>, "A registry call was made without registryAddress in config."],
          [<InlineCode key="4">RegistryDeploymentBlockRequired</InlineCode>, "getAllMerchants() called without registryDeploymentBlock set — refuses rather than scanning logs from genesis."],
          [<InlineCode key="5">UnsupportedSettlementChain</InlineCode>, "A settlementChainId (from createDirectIntent or a merchant's registry config) isn't one of SupportedSettlementChainId."],
          [<InlineCode key="6">InsufficientUnifiedBalance</InlineCode>, "The buyer's unified balance can't cover the intent amount — only checked pre-flight for a known USD stablecoin settlementToken."],
          [<InlineCode key="7">UnroutableBalance</InlineCode>, "Particle's own routing rejected the transfer (code -32653, “Insufficient primary token balance”) even though the pre-flight check above considered the balance sufficient — Particle doesn't publish the reserve/fee logic behind this."],
          [<InlineCode key="8">UserRejectedSignature</InlineCode>, "An actual EIP-1193 rejection (code 4001) — a network error or signer bug during signing surfaces as MorvaSdkError instead, never as this."],
          [<InlineCode key="9">SettlementTimeout</InlineCode>, "No settlement signal within settlementTimeoutMs — genuinely unresolved, not a confirmed failure."],
          [<InlineCode key="10">MorvaSdkError</InlineCode>, "Base class — also used directly to wrap any unmapped underlying failure, with the original error folded into .message and the original on .cause."],
        ]}
      />

      <H2 id="handling">Handling the ones worth treating differently</H2>
      <P>
        Most of these are genuinely exceptional and fine to surface as a
        generic &quot;payment failed&quot; message. A few are normal outcomes
        your UI should handle explicitly, not just log:
      </P>
      <CodeBlock
        code={`import { InsufficientUnifiedBalance, UnroutableBalance, SettlementTimeout, UserRejectedSignature } from "@morva/sdk";

try {
  await session.pay(intent, { onStatus });
} catch (err) {
  if (err instanceof InsufficientUnifiedBalance || err instanceof UnroutableBalance) {
    // Same meaning to the buyer ("you can't cover this right now"), two
    // different points where it was caught — see the reference table.
  } else if (err instanceof SettlementTimeout) {
    // err.transactionId is still real — the payment may still land after the timeout.
    // Don't tell the buyer it failed; store the id and pass it back in as
    // resumeTransactionId on retry (see the callout below).
  } else if (err instanceof UserRejectedSignature) {
    // A real EIP-1193 rejection — the buyer closed the signature prompt.
    // Let them retry; this isn't a system error.
  }
}`}
      />
      <Callout tone="warning" title="SettlementTimeout is not the same as a failed payment">
        <P>
          The error message says this explicitly: the payment may still
          settle after the timeout elapses. Detecting settlement is a
          best-effort poll (see{" "}
          <a href="/docs/infrastructure#particle" className="font-semibold text-ink underline underline-offset-2">
            how settlement detection works
          </a>
          ) against a fallback signal, not a guarantee the funds never
          moved. Never call <InlineCode>session.pay()</InlineCode> again
          from scratch for this order — store{" "}
          <InlineCode>err.transactionId</InlineCode> and pass it back in as{" "}
          <InlineCode>resumeTransactionId</InlineCode> on the next call, so
          the SDK resumes checking the same transaction instead of building
          and submitting a second transfer. Retrying without it can charge
          the buyer twice for one order if the first transfer does land.
        </P>
      </Callout>
    </div>
  );
}
