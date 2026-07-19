# Morva

[![npm version](https://img.shields.io/npm/v/@morva/sdk.svg)](https://www.npmjs.com/package/@morva/sdk)

**Crypto checkout that feels like Web2.**

A headless TypeScript SDK that lets any merchant accept crypto payments from
a buyer holding funds on *any* chain, settled to one token, on one chain, of
the merchant's own choosing — while the buyer signs exactly once. Built for
the **UXMaxx Hackathon** (Particle Network EIP-7702 track + Arbitrum bonus
track): pushing crypto toward its actual potential by making existing
infrastructure disappear behind a familiar checkout, not by asking anyone to
learn something new.



[SDK on npm](https://www.npmjs.com/package/@morva/sdk) · [SDK source](sdk) ·
[Docs source](frontend/src/app/docs) ·
[Demo storefront source](frontend/src/app/demo) · [Smart contract](contracts)

> Run `pnpm dev` in `frontend/` and the SDK landing page is at `/`, the full
> docs site is at `/docs`, and the working demo storefront is at `/demo` —
> see [Running locally](#running-locally).

---

## The problem

A buyer's crypto is almost never in one place — some USDC on Base, a little
ETH on Arbitrum, something from an old airdrop on a third chain. Every
existing checkout flow makes the *buyer* solve that fragmentation before
they're even allowed to pay: find a bridge, pay gas twice, switch networks,
wait for finality, come back and try again. Most people abandon the cart
before finishing that sequence — it's not a wallet problem or a chain
problem, it's a checkout problem, and checkout is the least forgiving place
in any product for friction like this.

## The solution

The buyer clicks pay once. Morva reads their balance across every chain it
supports, sources liquidity from wherever it actually lives, and settles the
merchant's chosen token on the merchant's chosen chain — regardless of what
the buyer held or where.

```
Buyer's existing wallet (Magic embedded, or any EIP-7702-capable signer)
        │  EIP-7702 upgrade in place — same address, no migration
        ▼
Particle Universal Account ── reads balance across every supported chain
        │  one signature — routing, sourcing, and gas handled underneath
        ▼
Merchant's chosen settlement chain ── Arbitrum One by default, or any of
        │                             Ethereum, BNB Chain, Base, X Layer
        ▼
Merchant's settlementRecipient receives exactly the token they configured
```

Nothing in that chain is a new primitive. It's Particle Network's Universal
Accounts, Magic's embedded wallet, and a single settlement leg to whichever
chain the merchant configured, wired together so the person paying never
has to know any of it happened.

---

## What we actually built

Four real, working pieces — not a slide deck:

| Piece | What it is | Where |
|---|---|---|
| **`@morva/sdk`** | The headless payment engine described above. No UI, no React, no assumptions about your stack. | [`sdk/`](sdk) |
| **A real backend** | Postgres (Supabase) schema, wallet-based auth (Sign-In with Ethereum), Server Actions for merchant onboarding/inventory/orders — not mock data. | [`frontend/src/lib/db`](frontend/src/lib/db), [`frontend/src/lib/auth`](frontend/src/lib/auth) |
| **A working demo storefront** | Morva Plaza — real merchant onboarding, real product uploads, real checkout wired to the SDK, proving it end-to-end rather than in a video. | [`frontend/src/app/demo`](frontend/src/app/demo) |
| **`MorvaRegistry`** | An optional on-chain contract for merchants who want settlement config to be a public, self-sovereign record instead of something a backend alone controls. | [`contracts/src/MorvaRegistry.sol`](contracts/src/MorvaRegistry.sol) |

---

## The infrastructure — what we leveraged, why, and exactly where

This is the part a judge should be able to verify directly, not take our
word for. Every row links to the real implementation.

### Particle Network — Universal Accounts, EIP-7702 mode

"Particle handles it" doesn't survive one follow-up question, so here's
the actual machinery, bottom to top — using a real payment we ran during
development as the running example: **$1.20, sourced as 0.94 USDC already
on Arbitrum (the settlement chain) + 0.80 USDC on Base.**

Before any of the below: the buyer's cross-chain balance itself comes from
one call — [`sdk/src/ua/balance.ts#L24-L45`](sdk/src/ua/balance.ts#L24-L45) —
mapping `getPrimaryAssets()` into the per-asset, per-chain breakdown
everything else here is built on.

**Layer 1 — the account: why one signature can act on two chains.** In
EIP-7702 mode, the buyer's own EOA gets delegated smart-account code —
Universal Accounts are ERC-4337 smart-account implementations attached to
a pre-existing EOA, and 7702 lets that attachment happen *at the same
address* instead of deploying a separate contract. That's what makes this
checkout-viable: the buyer's existing address becomes programmable in
place, not replaced by a new one they'd have to fund.
- Forced EIP-7702, not Particle's ERC-4337 default —
  [`sdk/src/ua/account.ts#L12-L25`](sdk/src/ua/account.ts#L12-L25) —
  `useEIP7702: true` isn't a config option here, it's the only path.

Because the account is programmable, it executes **UserOperations** —
signed instruction bundles — instead of raw transactions. When our SDK
calls `createUniversalTransaction`, Particle plans a set of userops, one
per chain involved (a Base-side op releasing funds, an Arbitrum-side op
executing the actual ERC-20 transfer), and hands back a single root hash
covering all of them.
- The one signature over that root —
  [`sdk/src/ua/pay.ts#L151-L155`](sdk/src/ua/pay.ts#L151-L155) — the
  buyer signs `transaction.rootHash` exactly once; that one signature
  authorizes every userop underneath it.
- The 7702 delegation authorizations — a *separate* signed object from
  the payment signature above —
  [`sdk/src/ua/authorization.ts#L15-L45`](sdk/src/ua/authorization.ts#L15-L45)
  — one per chain that still needs its delegation activated, deduped by
  chain+nonce (an authorization nonce is scoped per chain, so two chains
  can legitimately share nonce `0`).

**Layer 2 — the movement: no bridge, an atomic swap with a counterparty.**
Nothing the buyer holds ever crosses a bridge. Instead, a decentralized
network of liquidity providers already holds inventory on every chain
Particle supports. The buyer's Base USDC goes to an LP on Base; that same
LP network releases the equivalent amount from inventory it already holds
on Arbitrum. Two local transfers, economically linked by the LP's own fee
— nothing physically travels between chains. This is exactly why sub-$1
test payments failed outright during development: an LP filling a
$0.10 leg earns less than the leg costs to facilitate. It's also why the
settlement token has to be one of Particle's recognized "primary assets"
(USDC/USDT/ETH/BNB/SOL) — the LP network only makes markets in tokens it
can safely hold and rebalance.
- Where our code actually hands Particle this problem —
  [`sdk/src/ua/pay.ts#L215-L248`](sdk/src/ua/pay.ts#L215-L248) —
  `buildTransferTransaction()` calls `createUniversalTransaction()` with
  an explicit `expectTokens` requirement whenever the settlement token is
  one Particle recognizes as primary (checked via its own exported
  `getSupportedToken()`) — falling back to the simpler
  `createTransferTransaction()` only for a token *outside* that
  recognized set, where cross-chain sourcing isn't available at all (see
  the doc comment at that link for why we don't always use the more
  obviously-named method — this exact distinction was a real, live bug we
  found and fixed).

**Layer 3 — the coordinator: who makes it atomic-ish.** Something has to
sequence "funds locked on Base" before "LP releases on Arbitrum" before
"the merchant transfer executes," and handle a leg failing. That's
Particle's own coordination layer — bundler nodes land each userop on its
chain, and execution is optimistic with a refund path if a leg dies.
- Where our code recognizes that refund path —
  [`sdk/src/ua/pay.ts#L80-L85`](sdk/src/ua/pay.ts#L80-L85) (the status
  codes) and [`#L405-L414`](sdk/src/ua/pay.ts#L405-L414) (checked against
  a live transaction) — `REFUND_FINISHED` specifically means a
  cross-chain leg died and the buyer's source funds came back. Our error
  handling has been modeling this architecture the whole time, not
  guessing at it.

**Layer 4 — gas: why the buyer never needed ETH anywhere.** A paymaster
fronts native gas on whichever chain needs it and recoups the cost from
the buyer's own primary assets — visible as `gasFeeTokenAmountInUSD` in
Particle's own fee quotes. This is inherent to calling
`createUniversalTransaction()` / `createTransferTransaction()` at all —
there's no gas-sponsorship flag in our own code, because we don't
configure this, Particle's backend just does it.
- Pinned dependency, deliberately —
  [`sdk/src/ua/account.ts#L5-L10`](sdk/src/ua/account.ts#L5-L10) —
  Universal Accounts was mid-migration to a V2 API surface at build time,
  so every type used here was read off that exact version's declarations,
  not the public docs.

> **The one-sentence version:** the buyer's EOA becomes a smart account in
> place via EIP-7702; one signature authorizes a tree of userops across
> chains; liquidity providers who already hold inventory on both sides
> atomically take the buyer's funds locally and release equivalent funds
> on the settlement chain; Particle's own coordination layer sequences it
> and handles refunds; and a paymaster covers gas everywhere. Nothing
> bridges — value changes hands.

### Magic — the buyer's signer

Universal Accounts in EIP-7702 mode need a real EIP-7702 authorization
signature from the buyer's actual wallet. Standard injected wallets
(MetaMask, Rabby) don't expose a method for that today — embedded providers
with native 7702 support do. Magic is the one proven here.

- **The signer implementation** —
  [`frontend/src/lib/magic-signer.ts`](frontend/src/lib/magic-signer.ts) —
  implements the SDK's `MorvaSigner` interface entirely through Magic's own
  API: `signMessage` wraps Magic's EIP-1193 provider in a viem wallet client
  ([L23-L29](frontend/src/lib/magic-signer.ts#L23-L29)); `signAuthorization`
  calls Magic's native `sign7702Authorization`
  ([L31-L50](frontend/src/lib/magic-signer.ts#L31-L50)) and remaps its
  response into viem's `SignedAuthorization` shape. The buyer's private key
  never leaves Magic's iframe — this SDK never sees it.
- **Magic client setup** —
  [`frontend/src/lib/magic.ts`](frontend/src/lib/magic.ts) — lazily
  constructed (Magic throws under SSR), degrades to a clear "not configured"
  state instead of crashing when no key is set.
- **The signer contract it implements** —
  [`sdk/src/ua/signer.ts`](sdk/src/ua/signer.ts) — three methods, nothing
  more. `LocalSigner` in the same file is the raw-private-key
  implementation used only by tests and the e2e script — never a browser.

### Arbitrum One — the default settlement chain, not the only one

Merchants choose both *which token* and *which chain* they settle to.
`PaymentIntent.settlementChainId`
([`sdk/src/intents.ts#L13`](sdk/src/intents.ts#L13)) is typed as a union of
the five EVM chains Particle's Universal Account SDK supports in EIP-7702
mode — Ethereum, BNB Chain, Base, X Layer, and Arbitrum One
([`sdk/src/config.ts#L13`](sdk/src/config.ts#L13)); Solana is deliberately
excluded, since EIP-7702 has no Solana equivalent. Arbitrum One is only the
*default* when a caller doesn't specify one
([`sdk/src/config.ts#L25`](sdk/src/config.ts#L25)) — chosen because it's
what this repo's own reference storefront, Morva Plaza, settles to: one
chain to monitor, low gas for the final leg, no cross-chain settlement risk
on the merchant's side regardless of how many chains the buyer's liquidity
came from. A merchant integrating this SDK directly isn't limited to that
choice.

### MorvaRegistry — optional on-chain merchant identity

A deliberately minimal contract — [`contracts/src/MorvaRegistry.sol`](contracts/src/MorvaRegistry.sol) —
that never holds, receives, or forwards funds. It only stores where a
merchant's payments should be aimed, keyed by the merchant's own registering
address (one store per address, no admin role over anyone else's config).

Audited and gas-optimized as part of this build: the `MerchantConfig`
struct fields were reordered so `active` packs into the same storage slot
as `settlementRecipient` instead of stranding alone in a fourth slot —
verified with gas snapshots, **`registerMerchant` dropped from 114,469 to
92,359 gas (~19%)**. `MerchantUpdated` was also widened to carry the full
resulting config, not just the merchant address, so update history is
actually reconstructable from events alone. 12 tests, including a 256-run
fuzz test — [`contracts/test/MorvaRegistry.t.sol`](contracts/test/MorvaRegistry.t.sol).

### The backend — real persistence, not mock data

Built so that a merchant who onboards and a buyer who checks out are
touching a real database and a real payment call, not fixtures:

- **Schema** — [`frontend/src/lib/db/schema.ts`](frontend/src/lib/db/schema.ts) —
  Postgres via Drizzle, deployed on Supabase.
- **Wallet-based merchant auth (Sign-In with Ethereum)** —
  [`frontend/src/lib/auth/siwe.ts`](frontend/src/lib/auth/siwe.ts) issues
  and verifies a one-time signed message (viem's `verifyMessage`, no
  `ethers` — consistent with the SDK's own single-EVM-library choice);
  [`frontend/src/lib/auth/session.ts`](frontend/src/lib/auth/session.ts)
  issues the resulting JWT session.
- **The actual checkout wiring** —
  [`frontend/src/components/checkout/checkout-page-client.tsx#L87-L160`](frontend/src/components/checkout/checkout-page-client.tsx#L87-L160) —
  creates a real pending order, pays through `@morva/sdk` with
  `MagicSigner`, then marks the order settled or failed based on the real
  result. This is the file that proves the SDK and the demo storefront are
  actually connected, not adjacent.

---

## Quickstart

[`@morva/sdk` on npm](https://www.npmjs.com/package/@morva/sdk)

```bash
pnpm add @morva/sdk
```

```ts
import { createMorva } from "@morva/sdk";

const morva = createMorva({
  particle: { projectId, projectClientKey, projectAppUuid },
});

const session = await morva.connect(signer); // your MorvaSigner implementation
const intent = morva.createDirectIntent({
  amount: "4.99",
  orderId: "order-123",
  settlementToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC, Arbitrum One
  settlementRecipient: "0xYourMerchantAddress",
});

const result = await session.pay(intent, { onStatus: console.log });
console.log(result.transactionId, result.explorerUrl);
```

The full walkthrough — including a complete, working Magic-backed signer
implementation, error handling, and a pre-launch checklist — is in
[`frontend/src/app/docs/integration-guide`](frontend/src/app/docs/integration-guide/page.tsx),
served live at `/docs/integration-guide`.

---

## Stack

| Layer | Tech |
|---|---|
| Chain abstraction | Particle Network Universal Accounts, EIP-7702 mode |
| Buyer signer | Magic embedded wallets (email/social login, no seed phrase) |
| Settlement | Merchant-configurable — Arbitrum One (default), Ethereum, BNB Chain, Base, or X Layer |
| Registry | Arbitrum One |
| Signature/EVM library | viem — the only one, deliberately (no `ethers`) |
| Contracts | Solidity 0.8.24, Foundry |
| SDK build | TypeScript, tsup (ESM + CJS + `.d.ts`), vitest |
| Backend | Postgres (Supabase), Drizzle ORM, Next.js Server Actions |
| Frontend | Next.js 16, Tailwind, Framer Motion + GSAP |

## Repo structure

```
morva/
├── contracts/   MorvaRegistry.sol — optional on-chain merchant config (Foundry)
├── sdk/         @morva/sdk — the headless payment engine (tsup, ESM+CJS)
└── frontend/    SDK landing (/), full docs (/docs), demo storefront (/demo)
```

## Verification — this actually runs

Not just claimed — checked, every time something changed:

```bash
# contracts — 12 tests, 256-run fuzz, forge fmt clean
cd contracts && forge test && forge fmt --check

# sdk — 33 tests covering the payment path, registry client, and auth flow
cd sdk && pnpm build && pnpm test && pnpm typecheck

# frontend — full production build, real Supabase database
cd frontend && pnpm build
```

## Running locally

```bash
git clone https://github.com/JamesVictor-O/Morva.git
cd Morva && pnpm install

cd contracts && forge test
cd ../sdk && pnpm build && pnpm test
cd ../frontend && cp .env.example .env.local   # Particle + Magic + Supabase credentials
pnpm dev
```

`frontend/.env.example` documents every required variable. You'll need a
Particle dashboard project, a Magic app, and a Supabase project (Postgres +
Storage) — see [`frontend/src/app/docs/integration-guide`](frontend/src/app/docs/integration-guide/page.tsx)
for what each is used for.

## Track alignment

- ✅ Universal Accounts SDK in EIP-7702 mode — the payment path itself, not a bolt-on ([`sdk/src/ua/account.ts`](sdk/src/ua/account.ts))
- ✅ Cross-chain value movement via UA — every purchase sources liquidity across chains automatically
- ✅ Arbitrum One as the default settlement chain, real in production — every payment in this repo's own demo (Morva Plaza) settles there today ([`frontend/src/components/checkout/checkout-page-client.tsx`](frontend/src/components/checkout/checkout-page-client.tsx#L123-L134)), while the SDK itself supports merchant-chosen settlement across 5 EVM chains ([`sdk/src/config.ts`](sdk/src/config.ts#L13))
- 🔲 `MorvaRegistry` — built, tested (12 tests incl. a 256-run fuzz test), gas-audited; **not yet deployed to Arbitrum One mainnet** ([`contracts/src/MorvaRegistry.sol`](contracts/src/MorvaRegistry.sol)). The live payment path uses `createDirectIntent()` today, which doesn't require the registry — see [Core concepts](frontend/src/app/docs/concepts/page.tsx) for why that's a deliberate, not accidental, choice.
- ✅ Chain-abstracted, familiar UX — email sign-in via Magic, one signature, no bridging UI, no network switching
