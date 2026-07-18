# @morva/sdk

[![npm version](https://img.shields.io/npm/v/@morva/sdk.svg)](https://www.npmjs.com/package/@morva/sdk)

Headless TypeScript SDK for accepting crypto payments settled to a merchant's
chosen token, on a merchant's chosen chain, while the buyer pays from a
unified balance spread across whatever chains they actually hold assets on.

Buyers sign once. Under the hood, a Particle **Universal Account** in
**EIP-7702 mode** upgrades the buyer's own EOA in place (no new address, no
deposits) and routes liquidity from wherever it lives to the settlement
chain — Arbitrum One by default, or any of Ethereum, BNB Chain, Base, and
X Layer, the other EVM chains Particle's Universal Account SDK supports in
EIP-7702 mode.

No React, no UI, no wallet-connect flow — this package is the payment engine
a frontend calls into. `useEIP7702` mode means JSON-RPC browser wallets
(MetaMask, Rabby) cannot be used as the signer; supported signers are
embedded providers (Magic, Privy, Dynamic) or a raw private key
(`LocalSigner`, provided here).

## Install

```bash
pnpm add @morva/sdk
```

Peer requirements: none beyond what's already bundled (`viem`, the pinned
`@particle-network/universal-account-sdk`).

## Quickstart — direct intent, no registry

Registry deployment is optional. Before `MorvaRegistry` is live, build a
payment intent directly against a known settlement token/recipient:

```ts
import { createMorva, LocalSigner } from "@morva/sdk";

const morva = createMorva({
  particle: {
    projectId: process.env.PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.PARTICLE_APP_UUID!,
  },
});

const signer = new LocalSigner(process.env.BUYER_PRIVATE_KEY! as `0x${string}`);
const session = await morva.connect(signer);

const intent = morva.createDirectIntent({
  amount: "4.99",
  orderId: "order-123",
  settlementToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // native USDC, Arbitrum One
  settlementRecipient: "0xYourMerchantAddress",
  // settlementChainId: 8453, // optional — defaults to 42161 (Arbitrum One);
  //                          // pass any SupportedSettlementChainId to settle elsewhere
});

const result = await session.pay(intent, {
  onStatus: (status) => console.log(status),
});

console.log(result.transactionId, result.explorerUrl);
```

## Quickstart — via the registry

Once a merchant has called `registerMerchant()` against `MorvaRegistry`:

```ts
const morva = createMorva({
  particle: { projectId, projectClientKey, projectAppUuid },
  registryAddress: "0xMorvaRegistryOnArbitrumOne",
});

const intent = await morva.createPaymentIntent({
  merchant: "0xMerchantAddress",
  amount: "4.99",
  orderId: "order-123",
});

const session = await morva.connect(signer);
await session.pay(intent, { onStatus: console.log });
```

## API

| Call | Returns | Notes |
|---|---|---|
| `createMorva(config)` | `Morva` | Entry point. `registryAddress` optional until deployed. |
| `morva.getMerchant(address)` | `Promise<MerchantConfig>` | Throws `MerchantNotFound` if unregistered. |
| `morva.getAllMerchants()` | `Promise<Array<{address} & MerchantConfig>>` | Active merchants only; scans `MerchantRegistered` logs from `registryDeploymentBlock`. |
| `morva.registerMerchant(cfg, walletClient)` | `Promise<Hex>` | Merchant-side, needs a viem `WalletClient`. |
| `morva.updateMerchant(cfg, walletClient)` | `Promise<Hex>` | Same config shape as register. |
| `morva.createPaymentIntent({merchant, amount, orderId})` | `Promise<PaymentIntent>` | Reads settlement config (incl. chain) from the registry; throws `MerchantInactive` if the merchant deactivated. |
| `morva.createDirectIntent({amount, orderId, settlementToken, settlementRecipient, settlementChainId?})` | `PaymentIntent` | No registry lookup — synchronous. `settlementChainId` defaults to Arbitrum One. |
| `morva.connect(signer)` | `Promise<BuyerSession>` | Constructs the buyer's Universal Account (EIP-7702 mode). |
| `session.getUnifiedBalance()` | `Promise<UnifiedBalance>` | Cross-chain holdings, from `getPrimaryAssets()`. |
| `session.pay(intent, opts?)` | `Promise<PaymentResult>` | The full sign → authorize → submit → settle sequence. `opts`: `onStatus`, `onDebug`, `resumeTransactionId` (see "Retry safety"), `buildExplorerUrl`. |

`MorvaConfig` fields: `particle` (required), `registryAddress`,
`registryDeploymentBlock` (getLogs range floor), `registryRpcUrl` (RPC for
reading `MorvaRegistry` itself — always Arbitrum One, regardless of where
any given merchant settles; defaults to the public Arbitrum RPC),
`settlementRpcUrls` (per-settlement-chain RPC overrides used by `pay()`'s
settlement-detection fallback — `Partial<Record<SupportedSettlementChainId, string>>`,
each chain has a public default), `slippageBps` (default 100), and
`settlementTimeoutMs` (default 120_000 — how long `pay()` polls before
giving up on confirming settlement).

### Settlement chains

```ts
import { SUPPORTED_SETTLEMENT_CHAIN_IDS, DEFAULT_SETTLEMENT_CHAIN_ID } from "@morva/sdk";
// [1, 56, 8453, 196, 42161] — Ethereum, BNB Chain, Base, X Layer, Arbitrum One
// DEFAULT_SETTLEMENT_CHAIN_ID === 42161
```

This is the EVM subset of what Particle's Universal Account SDK supports in
EIP-7702 mode — Solana is excluded, since EIP-7702 has no Solana equivalent
and this SDK forces EIP-7702 mode unconditionally (see `ua/account.ts`).
Passing a `settlementChainId` outside this set throws `UnsupportedSettlementChain`.
A merchant's registry config carries its own `settlementChainId`, independent
of which chain the `MorvaRegistry` contract itself happens to be deployed on.

## Payment status lifecycle

`session.pay(intent, { onStatus })` reports:

```
building → authorizing → signing → submitted → settled
                                              ↘ unknown
                                              ↘ failed
```

- **building** — reading the buyer's unified balance, constructing the
  transfer transaction.
- **authorizing** — only emitted when the buyer's EOA needs a fresh EIP-7702
  delegation on a chain it touches for this payment; skipped silently on
  repeat payments once delegated.
- **signing** — the buyer signs the transaction's root hash.
- **submitted** — broadcast succeeded; `transactionId`/`explorerUrl` exist.
- **settled** — funds confirmed landed at `settlementRecipient` on the
  intent's `settlementChainId`, via Particle's own status signal or, if that
  doesn't resolve in time, a balance-delta fallback that checks the
  recipient's on-chain balance rose by at least the expected amount (not
  just "rose at all" — `settlementRecipient` is a merchant receiving
  payments from many buyers, so an unrelated inflow during the same poll
  window must never be mistaken for this payment).
- **unknown** — thrown as `SettlementTimeout`, **not the same as failed**.
  This means genuinely unresolved: the payment may still land after this
  fires, especially on a congested cross-chain route. Never auto-retry
  `pay()` from scratch on this — `SettlementTimeout.transactionId` is exactly
  what `PayOptions.resumeTransactionId` expects on the next call, so you
  resume checking the same transaction instead of submitting (and
  potentially charging) a second one. See the retry-safety note below.
- **failed** — a confirmed on-chain failure/refund, or any of the typed
  errors below. `pay()` never resolves without either returning a settled
  `PaymentResult` or throwing.

### Retry safety

`pay()` has no memory between calls — if a call throws `SettlementTimeout`,
store `err.transactionId` against your order, and pass it back in as
`resumeTransactionId` on the next `pay()` call for that same intent:

```ts
try {
  const result = await session.pay(intent, { onStatus });
} catch (err) {
  if (err instanceof SettlementTimeout) {
    await saveUnresolvedTransactionId(order.id, err.transactionId); // your own storage
    // later, on retry:
    // await session.pay(intent, { resumeTransactionId: err.transactionId });
    return;
  }
  throw err;
}
```

Without this, retrying a timed-out payment builds and submits a brand new
transfer — if the original one does land, the buyer has now paid twice for
one order.

## Errors

All extend `MorvaSdkError`, so `catch (err) { if (err instanceof MorvaSdkError) ... }`
catches anything this SDK throws.

| Error | Thrown when |
|---|---|
| `MerchantNotFound` | `getMerchant`/`createPaymentIntent` against an unregistered address. |
| `MerchantInactive` | Merchant exists but called `setActive(false)`. |
| `RegistryNotConfigured` | Registry call made without `registryAddress` in config. |
| `RegistryDeploymentBlockRequired` | `getAllMerchants()` called without `registryDeploymentBlock` set. |
| `UnsupportedSettlementChain` | A `settlementChainId` (explicit arg, or read from a merchant's registry config) isn't in `SUPPORTED_SETTLEMENT_CHAIN_IDS`. |
| `InsufficientUnifiedBalance` | Buyer's unified balance can't cover the intent amount — only checked pre-flight when `settlementToken` is a known USD stablecoin on that chain (currently Ethereum, Base, and Arbitrum One entries — see `config.ts`); other settlement tokens/chains surface an underfunded payment as `MorvaSdkError` or `UnroutableBalance` from the transfer attempt itself. |
| `UnroutableBalance` | Particle's own routing engine rejects the transfer as unroutable (code `-32653`, "Insufficient primary token balance"). Mostly relevant now for the `createTransferTransaction` fallback path (exotic settlement tokens outside Particle's primary-asset set) — for recognized primary assets (USDC, USDT, ETH, ...), `pay()` uses `createUniversalTransaction` instead specifically because live testing found the fallback method rejects genuinely-fundable cross-chain payments; see `ua/pay.ts`'s `buildTransferTransaction` for the full story. |
| `UserRejectedSignature` | The signer reported an actual EIP-1193 rejection (code `4001`, or a "user rejected"-shaped message) — anything else from `signAuthorization`/`signMessage` (a network error, a signer bug) surfaces as `MorvaSdkError` instead, so a checkout UI never tells a buyer "you cancelled" for an infra failure. |
| `SettlementTimeout` | No settlement signal within `settlementTimeoutMs` — see "Retry safety" above before treating this as a failure. |
| `MorvaSdkError` | Base class; also used directly to wrap any unmapped underlying failure with `cause` (the underlying message is folded into `.message` too, not just `.cause`). |

## Signers

```ts
interface MorvaSigner {
  address: Address;
  signMessage(message: Uint8Array): Promise<Hex>;
  signAuthorization(auth: AuthorizationRequest): Promise<SignedAuthorization>;
}
```

`LocalSigner` (exported here) implements this over a raw private key via
viem's native EIP-7702 signing — used by the e2e script and tests. A browser
signer (Magic embedded wallet, etc.) implementing the same interface is the
frontend package's job; this SDK never assumes `window.ethereum` since
injected JSON-RPC wallets cannot produce 7702 authorizations.

## Development

```bash
pnpm build       # tsup → dist/ (ESM + CJS + .d.ts)
pnpm typecheck   # tsc --noEmit, strict
pnpm test        # vitest — pure logic + mocked network, no live calls
pnpm e2e         # scripts/e2e-payment.ts — REAL mainnet payment, see below
```

### Gate 2 — live e2e payment

`scripts/e2e-payment.ts` pays ~1 USDC to a recipient on Arbitrum One from a
buyer EOA whose funds live on a *different* chain, using real Particle
infrastructure and real mainnet funds. Copy `.env.example` to `.env` in
`sdk/` and fill in:

```
PARTICLE_PROJECT_ID=
PARTICLE_CLIENT_KEY=
PARTICLE_APP_UUID=
BUYER_PRIVATE_KEY=      # funded with a small amount on a non-Arbitrum chain
MERCHANT_RECIPIENT=     # any address; script reads its Arbitrum USDC balance before/after
```

Then `pnpm e2e`. This has **not** been run against live credentials in this
environment — doing so requires a real Particle dashboard project and a
funded buyer key, neither of which exist here. Treat this gate as open until
someone runs it with real values; a failure here means an integration
misunderstanding to resolve against Particle's docs, not a code bug to patch
around.
