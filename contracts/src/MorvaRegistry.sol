// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MorvaRegistry
/// @notice The on-chain source of truth for merchant payment configuration.
/// Merchants write how they want to be paid; the Morva SDK reads it at
/// checkout time to build the buyer's payment. This contract never holds,
/// receives, or forwards funds — every payment is a direct ERC-20 transfer
/// from buyer to `settlementRecipient`, aimed using the data stored here.
/// Merchant identity is the registering address: one store per address,
/// by design, with no delegation or ownership transfer.
contract MorvaRegistry {
    /// @notice A merchant's settlement configuration.
    /// @param settlementToken ERC-20 the merchant is paid in (e.g. USDC).
    /// @param settlementRecipient Address funds are sent to.
    /// @param active Whether the merchant is currently accepting payments.
    /// @param settlementChainId The chain settlementToken/settlementRecipient
    /// live on — a real EVM chain id (e.g. 42161 for Arbitrum One), not
    /// scoped to whatever chain this registry contract itself is deployed
    /// on. Left unvalidated on-chain (any nonzero uint32): which chains a
    /// buyer's Universal Account can actually settle to is a Particle
    /// capability that evolves over time, and is enforced off-chain by the
    /// SDK (see SUPPORTED_SETTLEMENT_CHAIN_IDS in sdk/src/config.ts) —
    /// duplicating that allowlist here would mean redeploying this
    /// contract every time Particle adds chain support.
    /// @param metadataURI Off-chain JSON: { name, logoUrl, description }.
    /// @dev Field order is deliberate, not cosmetic: `active` and
    /// `settlementChainId` sit directly after `settlementRecipient` so
    /// they pack into the same storage slot as it (two addresses don't fit
    /// together, but the 12 bytes left after one address fits a bool plus
    /// a uint32 with room to spare) — `metadataURI` is a dynamic type and
    /// would always start a fresh slot regardless of where it's declared,
    /// so it's last. This keeps registerMerchant/updateMerchant at 2 fixed
    /// storage slots instead of 3. Reordering changes the ABI tuple order
    /// — safe only pre-deployment; if this ships after a real deployment,
    /// it's a breaking change, not a refactor.
    struct MerchantConfig {
        address settlementToken;
        address settlementRecipient;
        bool active;
        uint32 settlementChainId;
        string metadataURI;
    }

    mapping(address merchant => MerchantConfig config) internal _merchants;

    /// @notice Emitted once, when a merchant first registers.
    event MerchantRegistered(
        address indexed merchant,
        address settlementToken,
        address settlementRecipient,
        uint32 settlementChainId,
        string metadataURI
    );

    /// @notice Emitted whenever a registered merchant's config changes (via
    /// updateMerchant or setActive), carrying the full resulting config —
    /// not just the merchant address — so an off-chain indexer can
    /// reconstruct complete history from events alone, without an
    /// archive-node getMerchant() call at each historical block. This is
    /// what actually backs the "history stays readable through past
    /// events" guarantee described below; a merchant-only event wouldn't.
    event MerchantUpdated(
        address indexed merchant,
        address settlementToken,
        address settlementRecipient,
        bool active,
        uint32 settlementChainId,
        string metadataURI
    );

    /// @notice Thrown when `msg.sender` is already registered.
    error AlreadyRegistered();

    /// @notice Thrown when `msg.sender` is not registered.
    error NotRegistered();

    /// @notice Thrown when a config has a zero settlementToken,
    /// settlementRecipient, or settlementChainId.
    error InvalidConfig();

    /// @notice Registers `msg.sender` as a merchant. Reverts if already
    /// registered. `cfg.active` is ignored on registration — a merchant is
    /// always active the moment it registers.
    function registerMerchant(MerchantConfig calldata cfg) external {
        if (_merchants[msg.sender].settlementRecipient != address(0)) revert AlreadyRegistered();
        if (cfg.settlementToken == address(0) || cfg.settlementRecipient == address(0) || cfg.settlementChainId == 0) {
            revert InvalidConfig();
        }

        _merchants[msg.sender] = MerchantConfig({
            settlementToken: cfg.settlementToken,
            settlementRecipient: cfg.settlementRecipient,
            metadataURI: cfg.metadataURI,
            settlementChainId: cfg.settlementChainId,
            active: true
        });

        emit MerchantRegistered(
            msg.sender, cfg.settlementToken, cfg.settlementRecipient, cfg.settlementChainId, cfg.metadataURI
        );
    }

    /// @notice Updates `msg.sender`'s existing config, including `active`.
    /// Reverts if `msg.sender` isn't registered yet.
    function updateMerchant(MerchantConfig calldata cfg) external {
        if (_merchants[msg.sender].settlementRecipient == address(0)) revert NotRegistered();
        if (cfg.settlementToken == address(0) || cfg.settlementRecipient == address(0) || cfg.settlementChainId == 0) {
            revert InvalidConfig();
        }

        _merchants[msg.sender] = cfg;

        emit MerchantUpdated(
            msg.sender, cfg.settlementToken, cfg.settlementRecipient, cfg.active, cfg.settlementChainId, cfg.metadataURI
        );
    }

    /// @notice Flips `msg.sender`'s active flag without touching any other
    /// field. Use this to deactivate instead of deleting — history stays
    /// readable through past events and getMerchant.
    function setActive(bool active) external {
        MerchantConfig storage merchant = _merchants[msg.sender];
        if (merchant.settlementRecipient == address(0)) revert NotRegistered();

        merchant.active = active;

        emit MerchantUpdated(
            msg.sender,
            merchant.settlementToken,
            merchant.settlementRecipient,
            active,
            merchant.settlementChainId,
            merchant.metadataURI
        );
    }

    /// @notice Reads a merchant's config. Returns a zeroed struct for an
    /// unregistered address rather than reverting — callers detect
    /// registration via `settlementRecipient == address(0)` (or
    /// `isRegistered`).
    function getMerchant(address merchant) external view returns (MerchantConfig memory) {
        return _merchants[merchant];
    }

    /// @notice Convenience check equivalent to
    /// `getMerchant(merchant).settlementRecipient != address(0)`.
    function isRegistered(address merchant) external view returns (bool) {
        return _merchants[merchant].settlementRecipient != address(0);
    }
}
