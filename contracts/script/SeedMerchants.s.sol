// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MorvaRegistry} from "../src/MorvaRegistry.sol";

/// @notice Registers up to 3 demo merchants against an already-deployed
/// MorvaRegistry, to populate the Plaza demo. Re-runnable: any of the 3
/// keys whose address is already registered is skipped rather than
/// reverting the whole run.
///
/// Required env:
///   REGISTRY_ADDRESS        deployed MorvaRegistry address
///   MERCHANT_KEY_1..3       private keys of the 3 demo merchants
///   MERCHANT_METADATA_URI_1..3   off-chain metadata JSON URI per merchant
///
/// Optional env:
///   SETTLEMENT_TOKEN        ERC-20 all demo merchants settle in.
///                           Defaults to native USDC on Arbitrum One.
contract SeedMerchantsScript is Script {
    address internal constant DEFAULT_SETTLEMENT_TOKEN = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;

    function run() public {
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS");
        MorvaRegistry registry = MorvaRegistry(registryAddress);
        address settlementToken = vm.envOr("SETTLEMENT_TOKEN", DEFAULT_SETTLEMENT_TOKEN);

        _seed(registry, vm.envUint("MERCHANT_KEY_1"), vm.envOr("MERCHANT_METADATA_URI_1", string("")), settlementToken);
        _seed(registry, vm.envUint("MERCHANT_KEY_2"), vm.envOr("MERCHANT_METADATA_URI_2", string("")), settlementToken);
        _seed(registry, vm.envUint("MERCHANT_KEY_3"), vm.envOr("MERCHANT_METADATA_URI_3", string("")), settlementToken);
    }

    function _seed(MorvaRegistry registry, uint256 privateKey, string memory metadataURI, address settlementToken)
        internal
    {
        address merchant = vm.addr(privateKey);

        if (registry.isRegistered(merchant)) {
            console.log("Already registered, skipping:", merchant);
            return;
        }

        vm.startBroadcast(privateKey);
        registry.registerMerchant(
            MorvaRegistry.MerchantConfig({
                settlementToken: settlementToken, settlementRecipient: merchant, metadataURI: metadataURI, active: true
            })
        );
        vm.stopBroadcast();

        console.log("Registered merchant:", merchant);
    }
}
