// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DiagnoseVault is Script {
    address constant VAULT_ADDRESS = 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1;
    address constant WBERA = 0x6969696969696969696969696969696969696969;

    // Expected initialized addresses
    address constant EXPECTED_NECT = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant EXPECTED_LSP = 0x597877Ccf65be938BD214C4c46907669e3E62128;
    address constant EXPECTED_TARGET_POOL =
        0x9A3549ef882584a687C1FF1843e3B3C07a2A0cB2;

    function run() public view {
        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);

        console.log("=== COMPLETE VAULT DIAGNOSIS ===");

        // Check basic info
        console.log("Name:", vault.name());
        console.log("Symbol:", vault.symbol());
        console.log("Owner:", vault.owner());

        // Check asset address
        address assetAddr = address(vault.asset());
        console.log("Asset address:", assetAddr);
        console.log("Expected WBERA:", WBERA);
        console.log("Asset matches WBERA:", assetAddr == WBERA);

        // Check initialization status
        address nectAddr = vault.nectToken();
        address lspAddr = vault.liquidStabilityPool();
        address targetPoolAddr = vault.targetPool();

        console.log("=== INITIALIZATION STATUS ===");
        console.log("NECT Token:", nectAddr);
        console.log("Expected NECT:", EXPECTED_NECT);
        console.log("NECT Correct:", nectAddr == EXPECTED_NECT);

        console.log("LSP Address:", lspAddr);
        console.log("Expected LSP:", EXPECTED_LSP);
        console.log("LSP Correct:", lspAddr == EXPECTED_LSP);

        console.log("Target Pool:", targetPoolAddr);
        console.log("Expected Pool:", EXPECTED_TARGET_POOL);
        console.log("Pool Correct:", targetPoolAddr == EXPECTED_TARGET_POOL);

        // Check if vault is initialized
        bool isInitialized = (nectAddr != address(0) && lspAddr != address(0));
        console.log("Vault Initialized:", isInitialized);

        // Test contract calls
        console.log("=== CONTRACT CALL TESTS ===");

        // Try WBERA contract - using IERC20Metadata for name()
        try IERC20Metadata(WBERA).name() returns (string memory name) {
            console.log("WBERA Name:", name);
        } catch {
            console.log("WBERA name() not available (or call failed)");
        }

        // Test WBERA balance call
        try IERC20(WBERA).balanceOf(VAULT_ADDRESS) returns (uint256 balance) {
            console.log("Vault WBERA Balance:", balance);
        } catch {
            console.log("WBERA balance call failed!");
        }

        // Try NECT contract if initialized
        if (nectAddr != address(0)) {
            try IERC20Metadata(nectAddr).name() returns (string memory name) {
                console.log("NECT Name:", name);
            } catch {
                console.log("NECT name() not available (or call failed)");
            }
        }

        // Test totalAssets call - this is the key one that was failing
        try vault.totalAssets() returns (uint256 assets) {
            console.log("Total Assets:", assets);
            console.log("Vault is working correctly!");
        } catch {
            console.log(
                "totalAssets() call failed - VAULT NEEDS INITIALIZATION!"
            );
        }

        // Test other key functions
        try vault.totalSupply() returns (uint256 supply) {
            console.log("Total Supply:", supply);
        } catch {
            console.log("totalSupply() call failed");
        }

        console.log("=== DIAGNOSIS COMPLETE ===");
        if (!isInitialized) {
            console.log(
                "ACTION NEEDED: Run InitializeVault.s.sol to fix the vault!"
            );
        } else {
            console.log("Vault appears to be properly initialized!");
        }
    }
}
