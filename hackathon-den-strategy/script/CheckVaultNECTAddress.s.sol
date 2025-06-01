// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";

contract CheckVaultNECTAddress is Script {
    address constant VAULT_ADDRESS = 0x9D0b45d6b6D5BEd077e52f1706BE49E1D402d2d2;

    function run() public view {
        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);

        console.log("=== VAULT NECT ADDRESS CHECK ===");
        console.log("Vault Address:", VAULT_ADDRESS);

        // Get the NECT address that the vault was initialized with
        address vaultNECT = vault.nectToken();
        console.log("Vault NECT Address:", vaultNECT);

        // Compare with expected addresses
        address expectedNECT = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
        address usedInTrace = 0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64;

        console.log("Expected NECT:", expectedNECT);
        console.log("Address from trace:", usedInTrace);

        console.log("Vault matches expected:", vaultNECT == expectedNECT);
        console.log("Vault matches trace:", vaultNECT == usedInTrace);

        console.log("=== SOLUTION ===");
        if (vaultNECT == expectedNECT) {
            console.log("Vault has correct NECT address");
            console.log("But trace shows different address being used");
            console.log(
                "Need to check for hardcoded NECT address in strategy execution"
            );
        } else if (vaultNECT == usedInTrace) {
            console.log("Vault NECT matches trace address");
            console.log(
                "Deploy script and vault are using different NECT addresses"
            );
        } else {
            console.log("Neither address matches vault NECT");
            console.log("Something is very wrong!");
        }
    }
}
