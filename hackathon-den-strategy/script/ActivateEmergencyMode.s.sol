// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";

contract ActivateEmergencyMode is Script {
    address constant VAULT_ADDRESS = 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1; // Your working vault

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);

        console.log("=== ACTIVATING EMERGENCY MODE ===");
        console.log("Vault:", VAULT_ADDRESS);
        console.log("This will bypass the broken LSP");

        // CORRECT FUNCTION: activate emergency mode first
        vault.activateEmergencyMode(
            "LSP contract not working - bypass temporarily"
        );

        console.log("Emergency mode activated!");
        console.log("Now deposits should work without LSP calls");

        // Check that emergency mode is now active
        bool isEmergency = vault.emergencyMode();
        console.log("Emergency mode status:", isEmergency);

        vm.stopBroadcast();
    }
}
