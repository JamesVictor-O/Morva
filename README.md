````markdown
# Morva

**One balance. Any chain.**

Morva is a chain-abstracted financial account that turns fragmented crypto assets into a single spendable balance.

Today, users often hold assets across multiple wallets, chains, and tokens:

- USDC on Base
- USDT on Arbitrum
- ETH on Ethereum
- SOL on Solana

Although these assets belong to the same person, they cannot be used as a single balance without bridging, swapping, managing gas tokens, or moving funds between wallets.

Morva removes that complexity.

Users connect their wallets, view a unified balance, and spend from it without worrying about where funds are stored or how liquidity is routed.

---

# The Problem

Crypto users do not manage money.

They manage infrastructure.

A simple payment often requires:

1. Finding which wallet holds funds
2. Checking which chain those funds are on
3. Bridging assets
4. Swapping tokens
5. Acquiring gas tokens
6. Executing the transaction

This creates unnecessary friction.

For most users, money spread across multiple chains feels fragmented and difficult to use.

Example:

```text
Wallet A
100 USDC on Base

Wallet B
50 USDT on Arbitrum

Wallet C
2 SOL on Solana
```

Although the user owns all of these assets, they cannot easily treat them as one balance.

---

# The Solution

Morva provides a single financial account powered by chain abstraction.

Instead of showing:

```text
100 USDC on Base
50 USDT on Arbitrum
2 SOL on Solana
```

Morva shows:

```text
Available Balance

$427.63
```

When a user sends money, Morva automatically determines:

- Which assets should be used
- Which chains should execute the transaction
- How liquidity should be routed

The user simply chooses an amount and confirms the payment.

---

# How It Works

## Step 1: Sign In

Users sign in using a familiar authentication flow.

No seed phrases are required during onboarding.

---

## Step 2: Create Universal Account

Morva creates a Particle Universal Account.

This account becomes the user's chain-abstracted identity.

---

## Step 3: Connect Assets

Users connect existing wallets and deposit supported assets.

Examples:

- USDC
- USDT
- ETH
- SOL

---

## Step 4: View Unified Balance

Morva aggregates balances across supported chains and presents them as a single spendable balance.

---

## Step 5: Send or Spend

The user chooses an amount.

Morva handles:

- Asset selection
- Cross-chain routing
- Execution
- Settlement

without exposing blockchain complexity.

---

# User Flow

```text
Sign In
    ↓
Create Universal Account
    ↓
Connect Assets
    ↓
View Unified Balance
    ↓
Send / Spend
    ↓
Morva Routes Liquidity
    ↓
Transaction Complete
```

---

# Architecture

```text
┌────────────────────┐
│      Frontend      │
│    Next.js App     │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Authentication     │
│ Magic / Social     │
│ Login              │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Particle Universal │
│ Account            │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Balance Engine     │
│ Aggregates Assets  │
│ Across Chains      │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Routing Layer      │
│ Chain Abstraction  │
│ Liquidity Routing  │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Transaction        │
│ Settlement         │
└────────────────────┘
```

---

# Why Particle Network

Morva is built around Particle's Universal Accounts and chain abstraction infrastructure.

Without chain abstraction, users must manually:

- Switch networks
- Bridge assets
- Manage gas
- Move funds between chains

Particle allows Morva to present a single account experience while routing transactions across chains behind the scenes.

This enables the core product experience:

```text
One Account
One Balance
Any Chain
```

---

# Target Users

Morva is designed for users who regularly interact with assets across multiple chains.

Examples include:

### Freelancers

Receive payments from different clients on different networks.

### Creators

Manage earnings across ecosystems and platforms.

### Remote Workers

Hold digital assets across multiple wallets and chains.

### Crypto Users

Want a simpler way to manage and spend assets.

---

# Supported Assets

Initial MVP support:

- USDC
- USDT
- ETH
- SOL

Additional assets and networks can be added over time.

---

# MVP Scope

The initial version of Morva focuses on five core features:

### Authentication

- Social login

### Universal Account

- Particle Universal Account creation

### Asset Deposits

- Multi-chain asset support

### Unified Balance

- Single balance view

### Payments

- Cross-chain spending and transfers

---

# Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Authentication

- Magic

### Chain Abstraction

- Particle Network Universal Accounts
- EIP-7702

### Payments & Routing

- Particle Chain Abstraction

### Infrastructure

- Vercel

---

# Vision

Morva removes blockchain infrastructure from everyday financial interactions.

Users should not need to understand:

- Chains
- Bridges
- Gas Tokens
- Liquidity Routing

They should only need to understand one thing:

```text
Available Balance
```

Everything else happens automatically.
````
