// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MorvaRegistry} from "../src/MorvaRegistry.sol";

/// @notice Deploys MorvaRegistry. Run with the commands documented in
/// README.md — this script never broadcasts on its own; `--broadcast` is an
/// explicit flag the human running it must pass.
contract DeployScript is Script {
    function run() public returns (MorvaRegistry registry) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        registry = new MorvaRegistry();
        vm.stopBroadcast();

        console.log("MorvaRegistry deployed at:", address(registry));
        console.log("Deploy block:", block.number);
    }
}
