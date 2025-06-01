// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";

contract DeactivateEmergencyMode is Script {
    address constant VAULT_ADDRESS = 0x9a6b3eB19458420d18bad1460fd0503B07284FA4;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);

        console.log("=== DEACTIVATING EMERGENCY MODE ===");
        console.log("Vault:", VAULT_ADDRESS);

        bool currentMode = vault.emergencyMode();
        console.log("Current Emergency Mode:", currentMode);

        if (currentMode) {
            console.log(
                "Cannot deactivate emergency mode - no function exists!"
            );
            console.log(
                "Emergency mode can only be activated, not deactivated"
            );
            console.log("This is a security feature");
            console.log("");
            console.log(
                "Solution: Deploy new vault or work with emergency mode"
            );
        } else {
            console.log("Emergency mode already OFF");
        }

        vm.stopBroadcast();
    }
}
