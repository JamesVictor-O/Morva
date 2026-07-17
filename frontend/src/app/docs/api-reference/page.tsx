import Link from "next/link";
import { H1, Lead, H2, H3, P, InlineCode, Table, Callout } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";

export default function ApiReferencePage() {
  return (
    <div>
      <H1>API reference</H1>
      <Lead>Every exported function, class, and type, grouped the way you&apos;ll actually reach for them.</Lead>

      <H2 id="createmorva">createMorva(config)</H2>
      <P>The entry point. Returns a <InlineCode>Morva</InlineCode> instance — construct once per app.</P>
      <CodeBlock
        code={`interface MorvaConfig {
  particle: { projectId: string; projectClientKey: string; projectAppUuid: string };
  registryAddress?: Address;          // optional until you deploy MorvaRegistry
  registryDeploymentBlock?: bigint;   // required to call getAllMerchants()
  rpcUrl?: string;                    // Arbitrum One RPC, defaults to the public one
  slippageBps?: number;               // default 100 (1%)
  settlementTimeoutMs?: number;       // default 120_000 — how long pay() polls for settlement
}

function createMorva(config: MorvaConfig): Morva`}
      />

      <H2 id="morva">Morva</H2>
      <Table
        head={["Method", "Returns", "Notes"]}
        rows={[
          [<code key="1" className="font-mono text-[13px]">connect(signer)</code>, "Promise&lt;BuyerSession&gt;", "Constructs the buyer's Universal Account (EIP-7702 mode)."],
          [<code key="2" className="font-mono text-[13px]">createDirectIntent(args)</code>, "PaymentIntent", "Synchronous, no registry lookup."],
          [<code key="3" className="font-mono text-[13px]">createPaymentIntent(args)</code>, "Promise&lt;PaymentIntent&gt;", "Reads settlement config from MorvaRegistry; throws MerchantInactive if deactivated."],
          [<code key="4" className="font-mono text-[13px]" id="registermerchant">registerMerchant(cfg, walletClient)</code>, "Promise&lt;Hex&gt;", "Merchant-side. Needs a viem WalletClient for the merchant's own wallet."],
          [<code key="5" className="font-mono text-[13px]">updateMerchant(cfg, walletClient)</code>, "Promise&lt;Hex&gt;", "Same config shape as register."],
          [<code key="6" className="font-mono text-[13px]">getMerchant(address)</code>, "Promise&lt;MerchantConfig&gt;", "Throws MerchantNotFound if unregistered."],
          [<code key="7" className="font-mono text-[13px]">getAllMerchants()</code>, "Promise&lt;Array&lt;{'{'}address{'}'} &amp; MerchantConfig&gt;&gt;", "Active merchants only; scans MerchantRegistered logs from registryDeploymentBlock."],
        ]}
      />

      <H3>createDirectIntent / createPaymentIntent arguments</H3>
      <CodeBlock
        code={`morva.createDirectIntent({
  amount: string;              // human units, e.g. "4.99"
  orderId: string;
  settlementToken: Address;
  settlementRecipient: Address;
}): PaymentIntent

morva.createPaymentIntent({
  merchant: Address;
  amount: string;
  orderId: string;
}): Promise<PaymentIntent>`}
      />

      <H2 id="buyersession">BuyerSession</H2>
      <Table
        head={["Method", "Returns", "Notes"]}
        rows={[
          [<code key="1" className="font-mono text-[13px]">getUnifiedBalance()</code>, "Promise&lt;UnifiedBalance&gt;", "Cross-chain holdings, from getPrimaryAssets()."],
          [<code key="2" className="font-mono text-[13px]">pay(intent, opts?)</code>, "Promise&lt;PaymentResult&gt;", "The full sign → authorize → submit → settle sequence."],
        ]}
      />
      <CodeBlock
        code={`interface PaymentResult { transactionId: string; explorerUrl: string }
type PaymentStatus = "building" | "authorizing" | "signing" | "submitted" | "settled" | "failed";

session.pay(intent: PaymentIntent, opts?: {
  onStatus?: (status: PaymentStatus) => void;
}): Promise<PaymentResult>`}
      />

      <H2 id="types">Types</H2>
      <H3>PaymentIntent</H3>
      <CodeBlock
        code={`interface PaymentIntent {
  merchant?: Address;           // present only when built via createPaymentIntent
  orderId: string;
  amount: string;               // human-readable settlement-token units, e.g. "4.99"
  settlementToken: Address;
  settlementRecipient: Address;
  settlementChainId: 42161;     // Arbitrum One — fixed, not configurable
}`}
      />

      <H3>MerchantConfig / MerchantConfigInput</H3>
      <CodeBlock
        code={`interface MerchantConfig {
  settlementToken: Address;
  settlementRecipient: Address;
  metadataURI: string;          // off-chain JSON: { name, logoUrl, description }
  active: boolean;
  metadata?: MerchantMetadata;  // fetched from metadataURI, best-effort — never throws
}

type MerchantConfigInput = Omit<MerchantConfig, "metadata">;`}
      />

      <H3>UnifiedBalance</H3>
      <CodeBlock
        code={`interface UnifiedBalance {
  totalUsd: string;
  assets: UnifiedBalanceAsset[];
  raw: IAssetsResponse; // untransformed getPrimaryAssets() response
}

interface UnifiedBalanceAsset {
  symbol: string;
  totalAmount: string;
  usdValue: string;
  chains: UnifiedBalanceChain[];
}

interface UnifiedBalanceChain { chainId: number; amount: string }`}
      />

      <H2 id="signers">Signers</H2>
      <CodeBlock
        code={`interface MorvaSigner {
  address: Address;
  signMessage(message: Uint8Array): Promise<Hex>;
  signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization>;
}

interface AuthorizationRequest { contractAddress: Address; chainId: number; nonce: number }

class LocalSigner implements MorvaSigner {
  constructor(privateKey: Hex)
}`}
      />
      <Callout title="LocalSigner is for scripts and tests only">
        <P>
          It signs directly with a raw private key held in memory. Real
          frontends implement <InlineCode>MorvaSigner</InlineCode> against
          an embedded wallet provider instead — see the{" "}
          <Link href="/docs/integration-guide#signer" className="font-semibold text-ink underline underline-offset-2">
            integration guide
          </Link>{" "}
          for a complete Magic-backed implementation.
        </P>
      </Callout>

      <H2 id="registry-abi">MORVA_REGISTRY_ABI</H2>
      <P>
        The full contract ABI, exported for direct use with viem if you need
        to interact with <InlineCode>MorvaRegistry</InlineCode> outside the{" "}
        <InlineCode>Morva</InlineCode> class&apos;s own methods.
      </P>

      <div className="mt-10">
        <Link
          href="/docs/errors"
          className="flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Next: errors reference
        </Link>
      </div>
    </div>
  );
}
