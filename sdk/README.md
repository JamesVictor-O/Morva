# @morva/sdk

Headless TypeScript SDK for accepting crypto payments settled to a merchant's
chosen token on Arbitrum One, while the buyer pays from a unified balance
spread across whatever chains they actually hold assets on.

Buyers sign once. Under the hood, a Particle **Universal Account** in
**EIP-7702 mode** upgrades the buyer's own EOA in place (no new address, no
deposits) and routes liquidity from wherever it lives to Arbitrum One.

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
| `morva.createPaymentIntent({merchant, amount, orderId})` | `Promise<PaymentIntent>` | Reads settlement config from the registry; throws `MerchantInactive` if the merchant deactivated. |
| `morva.createDirectIntent({amount, orderId, settlementToken, settlementRecipient})` | `PaymentIntent` | No registry lookup — synchronous. |
| `morva.connect(signer)` | `Promise<BuyerSession>` | Constructs the buyer's Universal Account (EIP-7702 mode). |
| `session.getUnifiedBalance()` | `Promise<UnifiedBalance>` | Cross-chain holdings, from `getPrimaryAssets()`. |
| `session.pay(intent, {onStatus})` | `Promise<PaymentResult>` | The full sign → authorize → submit → settle sequence. |

`MorvaConfig` fields: `particle` (required), `registryAddress`,
`registryDeploymentBlock` (getLogs range floor), `rpcUrl` (Arbitrum One,
defaults to the public RPC), `slippageBps` (default 100), and
`settlementTimeoutMs` (default 120_000 — how long `pay()` polls before
giving up on confirming settlement).

## Payment status lifecycle

`session.pay(intent, { onStatus })` reports:

```
building → authorizing → signing → submitted → settled
                                              ↘ failed
```

- **building** — reading the buyer's unified balance, constructing the
  transfer transaction.
- **authorizing** — only emitted when the buyer's EOA needs a fresh EIP-7702
  delegation on a chain it touches for this payment; skipped silently on
  repeat payments once delegated.
- **signing** — the buyer signs the transaction's root hash.
- **submitted** — broadcast succeeded; `transactionId`/`explorerUrl` exist.
- **settled** — funds confirmed landed at `settlementRecipient` on Arbitrum
  One (or `pay()` throws `SettlementTimeout` — the payment may still settle
  after the timeout, that error message says so explicitly).
- **failed** — thrown as one of the typed errors below; `pay()` never
  resolves without either returning a settled `PaymentResult` or throwing.

## Errors

All extend `MorvaSdkError`, so `catch (err) { if (err instanceof MorvaSdkError) ... }`
catches anything this SDK throws.

| Error | Thrown when |
|---|---|
| `MerchantNotFound` | `getMerchant`/`createPaymentIntent` against an unregistered address. |
| `MerchantInactive` | Merchant exists but called `setActive(false)`. |
| `RegistryNotConfigured` | Registry call made without `registryAddress` in config. |
| `RegistryDeploymentBlockRequired` | `getAllMerchants()` called without `registryDeploymentBlock` set. |
| `InsufficientUnifiedBalance` | Buyer's unified balance can't cover the intent amount — only checked pre-flight when `settlementToken` is a known USD stablecoin (USDC/USDT/DAI on Arbitrum); other settlement tokens surface an underfunded payment as `MorvaSdkError` from the transfer attempt itself. |
| `UserRejectedSignature` | The signer rejected a signature or authorization request. |
| `SettlementTimeout` | No settlement signal within `settlementTimeoutMs`. |
| `MorvaSdkError` | Base class; also used directly to wrap any unmapped underlying failure with `cause`. |

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
