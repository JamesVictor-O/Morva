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
    /// @param settlementToken ERC-20 the merchant is paid in (e.g. USDC on Arbitrum).
    /// @param settlementRecipient Address funds are sent to.
    /// @param metadataURI Off-chain JSON: { name, logoUrl, description }.
    /// @param active Whether the merchant is currently accepting payments.
    struct MerchantConfig {
        address settlementToken;
        address settlementRecipient;
        string metadataURI;
        bool active;
    }

    mapping(address merchant => MerchantConfig config) internal _merchants;

    /// @notice Emitted once, when a merchant first registers.
    event MerchantRegistered(
        address indexed merchant, address settlementToken, address settlementRecipient, string metadataURI
    );

    /// @notice Emitted whenever a registered merchant's config changes
    /// (via updateMerchant or setActive).
    event MerchantUpdated(address indexed merchant);

    /// @notice Thrown when `msg.sender` is already registered.
    error AlreadyRegistered();

    /// @notice Thrown when `msg.sender` is not registered.
    error NotRegistered();

    /// @notice Thrown when a config has a zero settlementToken or settlementRecipient.
    error InvalidConfig();

    /// @notice Registers `msg.sender` as a merchant. Reverts if already
    /// registered. `cfg.active` is ignored on registration — a merchant is
    /// always active the moment it registers.
    function registerMerchant(MerchantConfig calldata cfg) external {
        if (_merchants[msg.sender].settlementRecipient != address(0)) revert AlreadyRegistered();
        if (cfg.settlementToken == address(0) || cfg.settlementRecipient == address(0)) revert InvalidConfig();

        _merchants[msg.sender] = MerchantConfig({
            settlementToken: cfg.settlementToken,
            settlementRecipient: cfg.settlementRecipient,
            metadataURI: cfg.metadataURI,
            active: true
        });

        emit MerchantRegistered(msg.sender, cfg.settlementToken, cfg.settlementRecipient, cfg.metadataURI);
    }

    /// @notice Updates `msg.sender`'s existing config, including `active`.
    /// Reverts if `msg.sender` isn't registered yet.
    function updateMerchant(MerchantConfig calldata cfg) external {
        if (_merchants[msg.sender].settlementRecipient == address(0)) revert NotRegistered();
        if (cfg.settlementToken == address(0) || cfg.settlementRecipient == address(0)) revert InvalidConfig();

        _merchants[msg.sender] = cfg;

        emit MerchantUpdated(msg.sender);
    }

    /// @notice Flips `msg.sender`'s active flag without touching any other
    /// field. Use this to deactivate instead of deleting — history stays
    /// readable through past events and getMerchant.
    function setActive(bool active) external {
        if (_merchants[msg.sender].settlementRecipient == address(0)) revert NotRegistered();

        _merchants[msg.sender].active = active;

        emit MerchantUpdated(msg.sender);
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
