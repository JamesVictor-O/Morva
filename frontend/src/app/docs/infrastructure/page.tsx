import Link from "next/link";
import { H1, Lead, H2, H3, P, UL, LI, InlineCode, Callout, Table } from "@/components/docs/prose";
import { CodeBlock } from "@/components/sdk/code-block";

export default function InfrastructurePage() {
  return (
    <div>
      <H1>The infrastructure</H1>
      <Lead>
        Morva doesn&apos;t reimplement chain abstraction, wallet custody, or
        settlement — it wires together four existing pieces of
        infrastructure into one payment call. This page explains what each
        one actually does, why it was chosen over the alternatives, and
        exactly how the SDK talks to it, file by file.
      </Lead>

      <H2 id="particle">Particle Network — Universal Accounts</H2>
      <P>
        Universal Accounts are the piece that makes &quot;pay from whatever
        you hold, wherever you hold it&quot; possible at all. A Universal
        Account reads a wallet&apos;s balances across every chain it
        supports, and when asked to move value to a destination chain/token,
        it works out how to source that liquidity — from a single chain, or
        split across several — and routes it there as part of one signed
        request.
      </P>

      <H3 id="eip7702">Why EIP-7702 mode specifically</H3>
      <P>
        Particle&apos;s Universal Accounts support two account models. The
        default is a separate ERC-4337 smart-contract account at a new,
        counterfactual address — meaning the buyer would need to fund a
        second address before anything works. <strong className="text-ink">EIP-7702 mode</strong> is
        the other option, and it&apos;s the one this SDK exclusively uses: it
        upgrades the buyer&apos;s own externally-owned account (EOA) in
        place, at the same address, via the EIP-7702 delegation the buyer
        already has in their wallet. No new address. No deposit step. The
        wallet a buyer already has just becomes the account.
      </P>
      <P>
        This is a one-way architectural decision baked into{" "}
        <InlineCode>sdk/src/ua/account.ts</InlineCode>:
      </P>
      <CodeBlock
        className="mt-4"
        code={`export function createUniversalAccount(config: MorvaConfig, ownerAddress: Address): UniversalAccount {
  return new UniversalAccount({
    projectId: config.particle.projectId,
    projectClientKey: config.particle.projectClientKey,
    projectAppUuid: config.particle.projectAppUuid,
    smartAccountOptions: {
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress,
      useEIP7702: true, // always — no ERC-4337-default path exists in this SDK
    },
    tradeConfig: { slippageBps: config.slippageBps ?? DEFAULT_SLIPPAGE_BPS },
  });
}`}
      />
      <Callout tone="warning" title="Version-pinned on purpose">
        <P>
          <InlineCode>@particle-network/universal-account-sdk</InlineCode> is
          pinned to an exact version (no <InlineCode>^</InlineCode> range) in
          the SDK&apos;s <InlineCode>package.json</InlineCode>. It was
          mid-migration to a V2 API surface at the time this was built, and
          every type this SDK reads off it — <InlineCode>IUserOpWithChain</InlineCode>,{" "}
          <InlineCode>EIP7702Authorization</InlineCode>,{" "}
          <InlineCode>IAssetsResponse</InlineCode> — was read directly from
          that exact version&apos;s type declarations, not from memory of
          public docs. Bumping it requires re-checking those types by hand.
        </P>
      </Callout>

      <H3>What each call actually does</H3>
      <Table
        head={["Call", "Where", "Does"]}
        rows={[
          [
            <code key="1" className="font-mono text-[13px]">getPrimaryAssets()</code>,
            "ua/balance.ts",
            "Reads the buyer's real balance across every supported chain, mapped into a per-asset, per-chain breakdown.",
          ],
          [
            <code key="2" className="font-mono text-[13px]">createUniversalTransaction()</code>,
            "ua/pay.ts",
            "Builds the actual cross-chain transfer for any settlement token Particle recognizes as a primary asset (USDC, USDT, ETH, ...) — destination token, chain, and receiver, all merchant-configured via the intent (Arbitrum One is only the default). See the callout below for why this call, not createTransferTransaction, is what actually sources liquidity cross-chain correctly.",
          ],
          [
            <code key="2b" className="font-mono text-[13px]">createTransferTransaction()</code>,
            "ua/pay.ts",
            "Fallback used only when the settlement token isn't one of Particle's recognized primary assets (an exotic ERC-20 with no cross-chain routing, e.g. an NFT-drop token) — correct for amounts the settlement chain already holds, not for amounts needing real cross-chain sourcing.",
          ],
          [
            <code key="3" className="font-mono text-[13px]">sendTransaction()</code>,
            "ua/pay.ts",
            "Submits the signed transaction + any EIP-7702 authorizations.",
          ],
          [
            <code key="4" className="font-mono text-[13px]">getTransaction()</code>,
            "ua/pay.ts",
            "Polled after submission to detect settlement — see the note below, this one's typed as `any` upstream.",
          ],
        ]}
      />
      <Callout title="Why createUniversalTransaction, not the more obviously-named createTransferTransaction">
        <P>
          Particle&apos;s SDK exposes both. <InlineCode>createTransferTransaction()</InlineCode>{" "}
          (internally tagged <InlineCode>transfer_v2</InlineCode>) is the
          obvious choice for &quot;send this amount to this address&quot; —
          it was the first thing this SDK used, and it&apos;s what the
          examples in Particle&apos;s own docs show. Direct, repeated live
          testing found it rejects payments that need real cross-chain
          sourcing as <InlineCode>&quot;Insufficient primary token
          balance&quot;</InlineCode> (code <InlineCode>-32653</InlineCode>),
          even against a wallet with genuinely sufficient funds spread
          across chains — a buyer holding $0.94 on the settlement chain and
          $0.80 on another chain could not complete a $1.20 payment, no
          matter how much of that $0.80 should have been routable.
        </P>
        <P>
          Particle&apos;s own reference app for this exact pattern —{" "}
          <a
            href="https://github.com/Particle-Network/universal-accounts-7702"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-ink underline underline-offset-2"
          >
            universal-accounts-7702
          </a>
          , specifically its <InlineCode>TransferCard.tsx</InlineCode> —
          doesn&apos;t use <InlineCode>createTransferTransaction()</InlineCode> either.
          It uses <InlineCode>createUniversalTransaction()</InlineCode> with
          an explicit <InlineCode>expectTokens</InlineCode> requirement plus
          a raw ERC-20 <InlineCode>transfer()</InlineCode> call. Re-running
          the exact amounts that failed above through{" "}
          <InlineCode>createUniversalTransaction()</InlineCode> instead
          succeeded for every one of them, against the same real backend.
          <InlineCode>expectTokens</InlineCode> only accepts Particle&apos;s
          small closed set of primary token types (ETH/USDT/USDC/BNB/SOL),
          so <InlineCode>ua/pay.ts</InlineCode> uses{" "}
          <InlineCode>getSupportedToken()</InlineCode> — also exported
          publicly from their SDK — to check whether{" "}
          <InlineCode>intent.settlementToken</InlineCode> is one of them,
          and only falls back to <InlineCode>createTransferTransaction()</InlineCode>{" "}
          when it isn&apos;t.
        </P>
      </Callout>
      <Callout title="Settlement detection has an intentional fallback">
        <P>
          <InlineCode>getTransaction()</InlineCode>&apos;s response is
          untyped (<InlineCode>Promise&lt;any&gt;</InlineCode>) in the pinned
          SDK version. <InlineCode>pay()</InlineCode> tries reading a
          numeric <InlineCode>.status</InlineCode> field against{" "}
          <InlineCode>UA_TRANSACTION_STATUS</InlineCode> first, but if that
          never resolves to a recognized terminal value before the timeout,
          it falls back to polling <InlineCode>settlementRecipient</InlineCode>&apos;s
          real ERC-20 balance on Arbitrum One directly via viem — a rise in
          balance is settlement, independent of whatever Particle&apos;s own
          status field says. This is why <InlineCode>pay()</InlineCode> needs
          an RPC URL, and why <InlineCode>SettlementTimeout</InlineCode>{" "}
          exists as a distinct, catchable error rather than a bare failure.
        </P>
      </Callout>

      <H2 id="magic">Magic — the buyer&apos;s signer</H2>
      <P>
        Universal Accounts in EIP-7702 mode need a real EIP-7702 authorization
        signature and message signing from the buyer&apos;s actual wallet.
        The SDK defines the contract for that (<InlineCode>MorvaSigner</InlineCode>)
        but deliberately doesn&apos;t implement a browser signer itself — that&apos;s
        the frontend&apos;s job, because it depends on whatever auth
        provider your product already uses. The reference implementation in
        this repo uses <strong className="text-ink">Magic</strong>, and it&apos;s
        a complete, working example of what any embedded-wallet integration
        needs to do.
      </P>
      <P>
        Magic&apos;s embedded wallet never exposes the buyer&apos;s private
        key to the app — signing happens inside Magic&apos;s own secure
        iframe. <InlineCode>MagicSigner</InlineCode>{" "}
        (<InlineCode>frontend/src/lib/magic-signer.ts</InlineCode>) implements{" "}
        <InlineCode>MorvaSigner</InlineCode>&apos;s two methods entirely
        through Magic&apos;s own API surface:
      </P>
      <CodeBlock
        className="mt-4"
        code={`export class MagicSigner implements MorvaSigner {
  constructor(private readonly magic: Magic, public readonly address: Address) {}

  async signMessage(message: Uint8Array): Promise<Hex> {
    // Wraps Magic's EIP-1193 provider in a viem wallet client — produces
    // the exact same personal_sign-over-raw-bytes signature LocalSigner
    // produces via viem's own account.signMessage, just routed through
    // Magic's iframe instead of a raw key.
    const walletClient = createWalletClient({ account: this.address, transport: custom(this.magic.rpcProvider) });
    return walletClient.signMessage({ account: this.address, message: { raw: message } });
  }

  async signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization> {
    // Magic's native EIP-7702 authorization signing.
    const signed = await this.magic.wallet.sign7702Authorization({
      contractAddress: auth.contractAddress,
      chainId: auth.chainId,
      nonce: auth.nonce,
    });
    return { address: signed.contractAddress, chainId: signed.chainId, nonce: signed.nonce,
      r: signed.r, s: signed.s, yParity: signed.v >= 27 ? signed.v - 27 : signed.v };
  }
}`}
      />
      <P>
        The two methods map directly onto what the payment flow needs:{" "}
        <InlineCode>signAuthorization</InlineCode> is what lets the buyer&apos;s
        EOA delegate to the Universal Account implementation the first time
        it&apos;s needed on a given chain; <InlineCode>signMessage</InlineCode> is
        what authorizes the actual transfer&apos;s root hash before
        submission.
      </P>
      <Callout tone="warning" title="Why not a standard injected wallet (MetaMask, Rabby)?">
        <P>
          Standard JSON-RPC injected wallets don&apos;t expose a method for
          producing EIP-7702 authorization signatures today. Embedded
          providers with native 7702 support — Magic, and others with an
          equivalent API — are what this mode requires. If your product uses
          a different embedded wallet provider, implementing{" "}
          <InlineCode>MorvaSigner</InlineCode> against it is normally this
          same shape: one call for message signing, one for 7702
          authorization signing.
        </P>
      </Callout>

      <H2 id="arbitrum">Arbitrum One — the default settlement chain</H2>
      <P>
        Every payment settles to a chain the merchant chooses per intent —{" "}
        <InlineCode>PaymentIntent.settlementChainId</InlineCode> is a real,
        configurable field, typed as a union of the five EVM chains
        Particle&apos;s Universal Account SDK supports in EIP-7702 mode
        (Ethereum, BNB Chain, Base, X Layer, and Arbitrum One — Solana is
        excluded, since EIP-7702 has no Solana equivalent). Arbitrum One is
        the <em>default</em> when a caller doesn&apos;t specify one, not the
        only option: <InlineCode>ua/pay.ts</InlineCode> passes{" "}
        <InlineCode>intent.settlementChainId</InlineCode> straight through
        to whichever of <InlineCode>createUniversalTransaction()</InlineCode>{" "}
        / <InlineCode>createTransferTransaction()</InlineCode> ends up
        building the transfer (see the callout above). A merchant chooses
        both <em>which token</em> and <em>which chain</em> they settle to.
      </P>
      <P>
        Morva Plaza, this repo&apos;s reference storefront, settles every
        payment to USDC on Arbitrum One deliberately — one chain to
        monitor, low gas for the final settlement leg, and no cross-chain
        settlement risk on the merchant&apos;s side regardless of how many
        chains the buyer&apos;s liquidity was actually sourced from. That&apos;s
        a choice Plaza makes with a real config value, not a limit the SDK
        imposes on every integration.
      </P>

      <H2 id="registry">MorvaRegistry — optional on-chain merchant identity</H2>
      <P>
        A small, deliberately minimal Solidity contract, itself always
        deployed to Arbitrum One. It never holds, receives, or forwards
        funds — it only stores where a merchant&apos;s payments should be
        aimed, including which chain they should land on (independent of
        which chain the registry contract itself lives on):
      </P>
      <CodeBlock
        className="mt-4"
        code={`struct MerchantConfig {
    address settlementToken;
    address settlementRecipient;
    bool active;
    uint32 settlementChainId; // e.g. 42161 for Arbitrum One
    string metadataURI; // off-chain JSON: { name, logoUrl, description }
}`}
      />
      <P>
        Merchant identity is the registering address — one store per
        address, no delegation, no admin role over anyone else&apos;s
        config. <InlineCode>morva.createPaymentIntent()</InlineCode> reads
        this on-chain and validates <InlineCode>settlementChainId</InlineCode>{" "}
        against the SDK&apos;s supported set before building an intent;{" "}
        <InlineCode>morva.createDirectIntent()</InlineCode> skips the
        registry entirely and takes <InlineCode>settlementChainId</InlineCode>{" "}
        as a direct argument instead. Whether you use it depends on whether
        you want settlement config to be a self-sovereign, publicly
        verifiable record, or something your own backend stores and
        controls — see{" "}
        <Link href="/docs/concepts#payment-intent" className="font-semibold text-ink underline underline-offset-2">
          direct vs registry intents
        </Link>{" "}
        for the tradeoff.
      </P>

      <H2 id="viem">viem — the connective tissue</H2>
      <P>
        Every piece of signature handling in this SDK — building the raw
        message bytes, serializing an EIP-7702 authorization into the exact
        compact format <InlineCode>sendTransaction()</InlineCode> expects,
        reading registry contract state, verifying addresses — runs through{" "}
        <a href="https://viem.sh" target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-2">
          viem
        </a>
        , deliberately to the exclusion of a second EVM library. Even{" "}
        <InlineCode>LocalSigner</InlineCode>&apos;s raw-key signing uses
        viem&apos;s native <InlineCode>signAuthorization</InlineCode>{" "}
        support rather than a separate signing library — one dependency
        surface for anything touching a signature, not two doing overlapping
        jobs.
      </P>

      <H2 id="together">How a payment actually moves through all four</H2>
      <UL>
        <LI><strong className="text-ink">1.</strong> The merchant&apos;s settlement token/recipient comes from either your own storage (<InlineCode>createDirectIntent</InlineCode>) or <strong>MorvaRegistry</strong> (<InlineCode>createPaymentIntent</InlineCode>).</LI>
        <LI><strong className="text-ink">2.</strong> <strong>Magic</strong> (or your embedded wallet provider) signs an EIP-7702 authorization the first time the buyer&apos;s EOA needs to delegate on a chain this payment touches.</LI>
        <LI><strong className="text-ink">3.</strong> <strong>Particle&apos;s Universal Account</strong> reads the buyer&apos;s real cross-chain balance, builds a transfer sourcing liquidity from wherever it actually lives, and the buyer signs its root hash — again through Magic.</LI>
        <LI><strong className="text-ink">4.</strong> The transaction submits, and settlement is confirmed on <strong>Arbitrum One</strong> — either via Particle&apos;s own status signal or, as a fallback, a direct viem balance read against the settlement token.</LI>
      </UL>
      <P>
        One buyer signature covers the whole sequence. Everything from
        &quot;which chain has my funds&quot; to &quot;did the merchant
        actually get paid&quot; happens without the buyer doing anything
        else.
      </P>

      <div className="mt-10">
        <Link
          href="/docs/integration-guide"
          className="flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Next: the integration guide
        </Link>
      </div>
    </div>
  );
}
