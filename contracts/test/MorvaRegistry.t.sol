// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MorvaRegistry} from "../src/MorvaRegistry.sol";

contract MorvaRegistryTest is Test {
    MorvaRegistry internal registry;

    address internal merchantA = makeAddr("merchantA");
    address internal merchantB = makeAddr("merchantB");
    address internal token = makeAddr("token");
    address internal recipient = makeAddr("recipient");
    uint32 internal constant ARBITRUM_ONE = 42161;

    function setUp() public {
        registry = new MorvaRegistry();
    }

    function _cfg(address settlementToken, address settlementRecipient, string memory uri, bool active)
        internal
        pure
        returns (MorvaRegistry.MerchantConfig memory)
    {
        return _cfg(settlementToken, settlementRecipient, uri, active, ARBITRUM_ONE);
    }

    function _cfg(
        address settlementToken,
        address settlementRecipient,
        string memory uri,
        bool active,
        uint32 settlementChainId
    ) internal pure returns (MorvaRegistry.MerchantConfig memory) {
        return MorvaRegistry.MerchantConfig({
            settlementToken: settlementToken,
            settlementRecipient: settlementRecipient,
            metadataURI: uri,
            active: active,
            settlementChainId: settlementChainId
        });
    }

    /// 1. register -> getMerchant returns the stored config with active ==
    /// true even if registered with active: false.
    function test_register_forcesActiveTrue() public {
        vm.prank(merchantA);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", false));

        MorvaRegistry.MerchantConfig memory stored = registry.getMerchant(merchantA);
        assertEq(stored.settlementToken, token);
        assertEq(stored.settlementRecipient, recipient);
        assertEq(stored.metadataURI, "ipfs://a");
        assertEq(stored.settlementChainId, ARBITRUM_ONE);
        assertTrue(stored.active);
    }

    /// 2. register twice from the same address reverts AlreadyRegistered.
    function test_register_twice_reverts() public {
        vm.startPrank(merchantA);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true));

        vm.expectRevert(MorvaRegistry.AlreadyRegistered.selector);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://b", true));
        vm.stopPrank();
    }

    /// 3. register with zero token or zero recipient reverts InvalidConfig.
    function test_register_zeroToken_reverts() public {
        vm.prank(merchantA);
        vm.expectRevert(MorvaRegistry.InvalidConfig.selector);
        registry.registerMerchant(_cfg(address(0), recipient, "ipfs://a", true));
    }

    function test_register_zeroRecipient_reverts() public {
        vm.prank(merchantA);
        vm.expectRevert(MorvaRegistry.InvalidConfig.selector);
        registry.registerMerchant(_cfg(token, address(0), "ipfs://a", true));
    }

    function test_register_zeroSettlementChainId_reverts() public {
        vm.prank(merchantA);
        vm.expectRevert(MorvaRegistry.InvalidConfig.selector);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true, 0));
    }

    /// 4. update from an unregistered address reverts NotRegistered.
    function test_update_unregistered_reverts() public {
        vm.prank(merchantA);
        vm.expectRevert(MorvaRegistry.NotRegistered.selector);
        registry.updateMerchant(_cfg(token, recipient, "ipfs://a", true));
    }

    /// 5. update changes fields (including settlementChainId) and emits
    /// MerchantUpdated.
    function test_update_changesFields_andEmits() public {
        vm.startPrank(merchantA);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true));

        address newToken = makeAddr("newToken");
        address newRecipient = makeAddr("newRecipient");
        uint32 newChainId = 8453; // Base

        vm.expectEmit(true, true, true, true, address(registry));
        emit MorvaRegistry.MerchantUpdated(merchantA, newToken, newRecipient, false, newChainId, "ipfs://updated");
        registry.updateMerchant(_cfg(newToken, newRecipient, "ipfs://updated", false, newChainId));
        vm.stopPrank();

        MorvaRegistry.MerchantConfig memory stored = registry.getMerchant(merchantA);
        assertEq(stored.settlementToken, newToken);
        assertEq(stored.settlementRecipient, newRecipient);
        assertEq(stored.metadataURI, "ipfs://updated");
        assertEq(stored.settlementChainId, newChainId);
        assertFalse(stored.active);
    }

    function test_update_zeroSettlementChainId_reverts() public {
        vm.startPrank(merchantA);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true));

        vm.expectRevert(MorvaRegistry.InvalidConfig.selector);
        registry.updateMerchant(_cfg(token, recipient, "ipfs://a", true, 0));
        vm.stopPrank();
    }

    /// 6. setActive(false) -> getMerchant shows inactive, MerchantUpdated
    /// carries the unchanged token/recipient/metadataURI alongside the new
    /// active flag; setActive from unregistered reverts.
    function test_setActive_updatesFlag() public {
        vm.startPrank(merchantA);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true));
        assertTrue(registry.getMerchant(merchantA).active);

        vm.expectEmit(true, true, true, true, address(registry));
        emit MorvaRegistry.MerchantUpdated(merchantA, token, recipient, false, ARBITRUM_ONE, "ipfs://a");
        registry.setActive(false);
        assertFalse(registry.getMerchant(merchantA).active);

        registry.setActive(true);
        assertTrue(registry.getMerchant(merchantA).active);
        vm.stopPrank();
    }

    function test_setActive_unregistered_reverts() public {
        vm.prank(merchantA);
        vm.expectRevert(MorvaRegistry.NotRegistered.selector);
        registry.setActive(true);
    }

    /// 7. MerchantRegistered event fields match inputs exactly.
    function test_registerMerchant_emitsExactEventFields() public {
        vm.prank(merchantA);
        vm.expectEmit(true, true, true, true, address(registry));
        emit MorvaRegistry.MerchantRegistered(merchantA, token, recipient, ARBITRUM_ONE, "ipfs://a");
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true));
    }

    /// 8. getMerchant on an unregistered address returns zeroed struct and
    /// does NOT revert; isRegistered returns false.
    function test_getMerchant_unregistered_returnsZeroed() public view {
        MorvaRegistry.MerchantConfig memory stored = registry.getMerchant(merchantA);
        assertEq(stored.settlementToken, address(0));
        assertEq(stored.settlementRecipient, address(0));
        assertEq(bytes(stored.metadataURI).length, 0);
        assertEq(stored.settlementChainId, 0);
        assertFalse(stored.active);
        assertFalse(registry.isRegistered(merchantA));
    }

    /// 9. two different addresses can register independently and don't
    /// affect each other.
    function test_twoMerchants_independent() public {
        address tokenB = makeAddr("tokenB");
        address recipientB = makeAddr("recipientB");

        vm.prank(merchantA);
        registry.registerMerchant(_cfg(token, recipient, "ipfs://a", true));

        vm.prank(merchantB);
        registry.registerMerchant(_cfg(tokenB, recipientB, "ipfs://b", true));

        MorvaRegistry.MerchantConfig memory a = registry.getMerchant(merchantA);
        MorvaRegistry.MerchantConfig memory b = registry.getMerchant(merchantB);

        assertEq(a.settlementToken, token);
        assertEq(a.settlementRecipient, recipient);
        assertEq(b.settlementToken, tokenB);
        assertEq(b.settlementRecipient, recipientB);

        vm.prank(merchantA);
        registry.setActive(false);

        assertFalse(registry.getMerchant(merchantA).active);
        assertTrue(registry.getMerchant(merchantB).active);
    }

    /// 10. fuzz: registerMerchant with fuzzed non-zero addresses, a fuzzed
    /// non-zero settlementChainId, and arbitrary metadataURI round-trips
    /// through getMerchant.
    function testFuzz_register_roundTrips(
        address merchant,
        address fuzzToken,
        address fuzzRecipient,
        uint32 fuzzChainId,
        string memory uri
    ) public {
        vm.assume(merchant != address(0));
        vm.assume(fuzzToken != address(0));
        vm.assume(fuzzRecipient != address(0));
        vm.assume(fuzzChainId != 0);

        vm.prank(merchant);
        registry.registerMerchant(_cfg(fuzzToken, fuzzRecipient, uri, true, fuzzChainId));

        MorvaRegistry.MerchantConfig memory stored = registry.getMerchant(merchant);
        assertEq(stored.settlementToken, fuzzToken);
        assertEq(stored.settlementRecipient, fuzzRecipient);
        assertEq(stored.metadataURI, uri);
        assertEq(stored.settlementChainId, fuzzChainId);
        assertTrue(stored.active);
        assertTrue(registry.isRegistered(merchant));
    }
}
