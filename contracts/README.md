# @morva/contracts — MorvaRegistry

`MorvaRegistry` is the on-chain source of truth for merchant payment
configuration, deployed to **Arbitrum One**. A merchant registers once —
settlement token, settlement recipient, an off-chain metadata URI — and the
Morva SDK reads that config at checkout to build the buyer's payment.

**This contract never holds, receives, or forwards funds.** Every payment is
a direct ERC-20 transfer from buyer to `settlementRecipient`; the registry
only stores where that transfer should be aimed. Merchant identity is the
registering address — one store per address, with no delegation, no
ownership transfer, and no admin role over anyone else's config.

## Interface

```solidity
struct MerchantConfig {
    address settlementToken;
    address settlementRecipient;
    string  metadataURI;
    bool    active;
}

function registerMerchant(MerchantConfig calldata cfg) external;
function updateMerchant(MerchantConfig calldata cfg) external;
function setActive(bool active) external;
function getMerchant(address merchant) external view returns (MerchantConfig memory);
function isRegistered(address merchant) external view returns (bool);

event MerchantRegistered(address indexed merchant, address settlementToken, address settlementRecipient, string metadataURI);
event MerchantUpdated(address indexed merchant);

error AlreadyRegistered();
error NotRegistered();
error InvalidConfig();
```

- `registerMerchant` reverts `AlreadyRegistered` if `msg.sender` already has
  a config, `InvalidConfig` for a zero `settlementToken`/`settlementRecipient`.
  `cfg.active` is ignored on registration — a merchant is always active the
  moment it registers.
- `updateMerchant` can change any field, including `active`; reverts
  `NotRegistered` if `msg.sender` hasn't registered yet.
- `setActive` is the deactivate/reactivate path — there is no delete
  function, so history stays readable through past events.
- `getMerchant` on an unregistered address returns a **zeroed struct, not a
  revert** — callers (including the SDK) detect registration via
  `settlementRecipient != address(0)`, or just call `isRegistered`.

## Test

```bash
forge test
```

12 tests, including a 256-run fuzz test on `registerMerchant`. Covers: the
forced-`active`-true rule, double-registration, zero-address rejection,
update/setActive from an unregistered address, exact event field matching
(`vm.expectEmit`), the zeroed-struct-not-revert behavior for unregistered
reads, and independence between two merchants' state.

```bash
forge fmt --check   # formatting
forge build         # compiles under the pinned solc 0.8.24 + optimizer settings
```

## Deploy

Copy `.env.example` to `.env` and fill in `PRIVATE_KEY` and
`ARBITRUM_RPC_URL`. Nothing here broadcasts on its own — `--broadcast` is an
explicit flag you pass when you're ready.

```bash
# Dry run against a fork — confirms the script executes without sending anything
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_RPC_URL

# Real deployment + Arbiscan verification (required for the hackathon — judges check this)
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_RPC_URL --broadcast --verify --etherscan-api-key $ARBISCAN_API_KEY
```

`foundry.toml` pins `solc = "0.8.24"` and a fixed optimizer configuration
(`optimizer = true`, `runs = 200`) specifically so the verifying build
always matches what actually got deployed — don't change these without
re-verifying.

## Seed demo merchants

After deploying, `script/SeedMerchants.s.sol` registers up to 3 demo
merchants to populate the Plaza. Fill in `REGISTRY_ADDRESS`,
`MERCHANT_KEY_1..3`, and `MERCHANT_METADATA_URI_1..3` in `.env` (see
`.env.example`), then:

```bash
forge script script/SeedMerchants.s.sol --rpc-url $ARBITRUM_RPC_URL --broadcast
```

Re-runnable: any of the 3 keys whose address is already registered is
skipped rather than reverting the whole run. All 3 merchants settle in the
same `SETTLEMENT_TOKEN` (defaults to native USDC on Arbitrum One,
`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`) unless overridden.

## ABI export

The SDK's `registry/abi.ts` must be generated from the compiled ABI, not
hand-written, so it can never drift from the actual deployed interface:

```bash
forge build
cat out/MorvaRegistry.sol/MorvaRegistry.json | jq '.abi' > MorvaRegistry.abi.json
```

## Deployed address

_Fill in once deployed — the deploy block matters, it's where the SDK's
`registryDeploymentBlock` config should point so `getAllMerchants()` doesn't
scan from genesis._

| Network | Address | Deploy block | Arbiscan |
|---|---|---|---|
| Arbitrum One | `TODO` | `TODO` | `TODO` |
