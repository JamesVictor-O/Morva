# Morva

**Crypto checkout that feels like Web2.**

Morva is a checkout SDK that lets online merchants accept crypto payments from buyers on any chain, settled to one token on one chain of the merchant's choosing.

The buyer pays from a single balance made up of everything they hold across chains — using their existing wallet, with one signature. No bridging, no network switching, no gas management. The merchant receives exactly the token they configured, every time.

Built for the UXmaxx Hackathon: Particle Network EIP-7702 track + Arbitrum bonus track.

---

## The problem

Crypto commerce loses the sale at checkout.

A buyer holds ETH on Base, USDC on Optimism, and POL on Polygon. The merchant accepts USDC on Arbitrum. To complete a purchase, the buyer must:

1. Find a bridge
2. Pay gas on two chains
3. Switch networks
4. Wait for finality
5. Return and try checkout again

Every step is a place to abandon the purchase. Most buyers do. This isn't a wallet problem or a chain problem — it's a checkout problem.

## The solution

```
  Buyer                        Morva                        Merchant
  one balance across    →     reads config on-chain,   →   receives USDC
  every chain, their          routes value, collects        on Arbitrum,
  own wallet                  one signature                 as configured
```

**Merchants** register how they want to get paid — settlement token, recipient address — in the Morva registry contract on Arbitrum One. Once.

**Buyers** click Pay. Morva builds a universal transaction against their cross-chain balance via Particle Network's Universal Accounts in EIP-7702 mode: their EOA becomes a chain-abstracted account *in place* — no new address, no migration, no deposits. One signature; routing, swapping, and gas happen underneath.

**Settlement** lands on Arbitrum One with a verifiable receipt.

---

## Integration

```tsx
import { MorvaPay } from "@morva/sdk/react";

<MorvaPay
  merchant="0x84f…c2A"
  amount="36.00"
  orderId="ord_1042"
  onSuccess={(r) => console.log(r.explorerUrl)}
/>
```

That's the whole integration. A headless core is also available:

```ts
import { createMorva } from "@morva/sdk";

const morva = createMorva({ particle: { /* credentials */ }, registryAddress });
const intent = await morva.createPaymentIntent({ merchant, amount: "36.00", orderId: "ord_1042" });
const session = await morva.connect(signer);
const result = await session.pay(intent, { onStatus: console.log });
```

---

## Live demo — the Plaza

<!-- PLACEHOLDER: demo URL -->
**[plaza demo →](https://TODO)**

The Plaza is a multi-merchant storefront proving the SDK end-to-end. Merchants open stalls the way they rent them in a physical market: register once, on-chain. Every stall can settle differently; every buyer pays the same way. The storefront renders directly from registry events — chain state is the UI.

Two buyer paths are supported:
- **Existing wallet** — the EOA is upgraded via EIP-7702 on first payment
- **Email / social login** — Magic embedded wallets, for buyers who have never held crypto

### Proof of settlement

<!-- PLACEHOLDER: replace with real values after Gate 2 / deployment -->
| | |
|---|---|
| Registry contract (Arbitrum One) | `TODO: address + Arbiscan link` |
| First cross-chain settlement | `TODO: explorer link — buyer funds sourced from two chains, settled USDC on Arbitrum` |

---

## How a payment actually happens

1. **Merchant registers** — settlement token + recipient stored in `MorvaRegistry` on Arbitrum One
2. **Buyer clicks Buy** — the SDK reads the merchant's config and builds a universal transaction against the buyer's balance across all supported chains
3. **One signature** — the buyer's 7702-upgraded EOA signs once; liquidity routing, swaps, and gas are handled by Universal Accounts
4. **Settled on Arbitrum** — the merchant's recipient address receives the configured token; the receipt links to the settlement transaction

## Architecture

```
morva/
├── contracts/   MorvaRegistry.sol — merchant config on Arbitrum One (Foundry)
├── sdk/         @morva/sdk — headless core + React checkout (tsup, ESM+CJS)
└── frontend/    the Plaza — Next.js demo storefront + merchant onboarding
```

```
Buyer EOA (existing wallet or Magic embedded)
        │  EIP-7702 upgrade in place
        ▼
Particle Universal Account ── unified balance across 8+ chains
        │  one signature, cross-chain liquidity routing
        ▼
Arbitrum One ── MorvaRegistry (merchant config) + settlement
        │
        ▼
Merchant recipient receives configured token
```

### The registry

Merchant identity is the owner address — one store per address, by design.

```solidity
struct MerchantConfig {
    address settlementToken;
    address settlementRecipient;
    string  metadataURI;
    bool    active;
}
```

The registry lives on Arbitrum even for future merchants settling elsewhere — Arbitrum is Morva's coordination layer, not just a deployment target.

---

## Stack

| Layer | Tech |
|---|---|
| Chain abstraction | Particle Network Universal Accounts, EIP-7702 mode |
| Settlement + registry | Arbitrum One |
| Buyer onboarding | Magic embedded wallets (social login) + existing EOAs |
| Contracts | Solidity, Foundry |
| SDK | TypeScript, viem, tsup (ESM + CJS + types) |
| Frontend | Next.js, TypeScript |

### Track compliance

- ✅ Universal Accounts SDK in EIP-7702 mode — the payment path itself
- ✅ Cross-chain operation moving value via UA — every purchase
- ✅ Deployed on and running primarily on Arbitrum — registry + all settlement
- ✅ Chain-abstracted UX — social login, gas abstraction, invisible routing

---

## Running locally

```bash
git clone https://github.com/TODO/morva
cd morva && pnpm install

# contracts
cd contracts && forge test

# sdk
cd sdk && pnpm build && pnpm test

# plaza
cd frontend && cp .env.example .env.local   # Particle + Magic credentials
pnpm dev
```

Required environment variables are documented in `.env.example`. You'll need a Particle dashboard project and a Magic app.



---


---
