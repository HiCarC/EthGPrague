// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract CheckVaultStatus is Script {
    address constant VAULT_ADDRESS = 0x9a6b3eB19458420d18bad1460fd0503B07284FA4;
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;

    function run() public view {
        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);
        IERC20 nect = IERC20(NECT_TOKEN);

        console.log("=== VAULT STATUS CHECK ===");
        console.log("Vault Address:", VAULT_ADDRESS);

        // Check emergency mode
        bool emergency = vault.emergencyMode();
        console.log("Emergency Mode:", emergency);

        // Check NECT balance
        uint256 nectBalance = nect.balanceOf(VAULT_ADDRESS);
        console.log("Vault NECT Balance:", nectBalance);
        console.log("NECT Amount (readable):", nectBalance / 1e18);

        if (emergency) {
            console.log("Emergency mode is ACTIVE - strategy disabled");
            console.log(
                "Need to deactivate emergency mode for strategy to work"
            );
        } else {
            console.log("Emergency mode is OFF - strategy enabled");
        }

        if (nectBalance > 0) {
            console.log("Vault has NECT - ready for strategy execution!");
        } else {
            console.log("No NECT in vault");
        }

        console.log("");
        console.log("=== NEXT STEPS ===");
        if (emergency) {
            console.log("1. Deactivate emergency mode");
            console.log("2. Try WBERA deposit");
        } else {
            console.log("1. Try WBERA deposit - should work now!");
        }
    }
}
