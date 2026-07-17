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
          [<InlineCode key="5">InsufficientUnifiedBalance</InlineCode>, "The buyer's unified balance can't cover the intent amount."],
          [<InlineCode key="6">UserRejectedSignature</InlineCode>, "The signer rejected a signature or EIP-7702 authorization request."],
          [<InlineCode key="7">SettlementTimeout</InlineCode>, "No settlement signal within settlementTimeoutMs."],
          [<InlineCode key="8">MorvaSdkError</InlineCode>, "Base class — also used directly to wrap any unmapped underlying failure, with the original error on .cause."],
        ]}
      />

      <H2 id="handling">Handling the ones worth treating differently</H2>
      <P>
        Most of these are genuinely exceptional and fine to surface as a
        generic &quot;payment failed&quot; message. Two are normal outcomes
        your UI should handle explicitly, not just log:
      </P>
      <CodeBlock
        code={`import { InsufficientUnifiedBalance, SettlementTimeout, UserRejectedSignature } from "@morva/sdk";

try {
  await session.pay(intent, { onStatus });
} catch (err) {
  if (err instanceof InsufficientUnifiedBalance) {
    // err.requiredUsd, err.availableUsd — show a real "you're short by $X" message
  } else if (err instanceof SettlementTimeout) {
    // err.transactionId is still real — the payment may still land after the timeout.
    // Don't tell the buyer it failed; tell them to check back / show the explorer link.
  } else if (err instanceof UserRejectedSignature) {
    // The buyer closed the signature prompt — let them retry, this isn't a system error.
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
          moved. If you receive this, check{" "}
          <InlineCode>err.transactionId</InlineCode> against Arbitrum One
          directly before telling a buyer their payment failed.
        </P>
      </Callout>
    </div>
  );
}
