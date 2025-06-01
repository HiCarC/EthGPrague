// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// Simple LSP interface for testing
interface ILSPTest {
    function provideToSP(uint256 _amount, address _frontEndTag) external;
    function getCompoundedNECTDeposit(
        address _depositor
    ) external view returns (uint256);
}

contract DebugLSPFailure is Script {
    address constant VAULT_ADDRESS = 0x9D0b45d6b6D5BEd077e52f1706BE49E1D402d2d2;
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant LSP_ADDRESS = 0x9158d1b0c9Cc4EC7640EAeF0522f710dADeE9a1B;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console.log("=== DEBUGGING LSP FAILURE ===");
        console.log("Vault Address:", VAULT_ADDRESS);
        console.log("NECT Token:", NECT_TOKEN);
        console.log("LSP Address:", LSP_ADDRESS);
        console.log("User:", user);

        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);
        IERC20 nect = IERC20(NECT_TOKEN);

        // Step 1: Check vault NECT balance
        uint256 vaultNECTBalance = nect.balanceOf(VAULT_ADDRESS);
        console.log("=== STEP 1: NECT BALANCES ===");
        console.log("Vault NECT Balance:", vaultNECTBalance);
        console.log("Vault NECT (readable):", vaultNECTBalance / 1e18);

        // Step 2: Check if vault has any NECT to provide
        if (vaultNECTBalance == 0) {
            console.log("PROBLEM: Vault has no NECT tokens!");
            console.log(
                "SOLUTION: Vault needs NECT tokens before strategy can work"
            );
            console.log("   - Either vault should borrow NECT from Beraborrow");
            console.log("   - Or user should transfer NECT to vault");
            return;
        }

        // Step 3: Check NECT contract details
        console.log("=== STEP 2: NECT CONTRACT STATUS ===");
        try IERC20Metadata(NECT_TOKEN).name() returns (string memory name) {
            console.log("NECT Name:", name);
        } catch {
            console.log("NECT name() call failed");
        }

        try IERC20Metadata(NECT_TOKEN).symbol() returns (string memory symbol) {
            console.log("NECT Symbol:", symbol);
        } catch {
            console.log("NECT symbol() call failed");
        }

        // Step 4: Check LSP contract
        console.log("=== STEP 3: LSP CONTRACT STATUS ===");
        ILSPTest lsp = ILSPTest(LSP_ADDRESS);

        // Try to get vault's current LSP deposit
        try lsp.getCompoundedNECTDeposit(VAULT_ADDRESS) returns (
            uint256 deposit
        ) {
            console.log("Vault's LSP Deposit:", deposit);
        } catch {
            console.log("LSP getCompoundedNECTDeposit() call failed");
            console.log("This suggests LSP contract might not be working");
        }

        // Step 5: Check allowances
        console.log("=== STEP 4: ALLOWANCE CHECK ===");
        uint256 allowance = nect.allowance(VAULT_ADDRESS, LSP_ADDRESS);
        console.log("Vault LSP Allowance:", allowance);
        // console.log("Amount trying to provide:", 285000000000000000);
        // console.log("Allowance sufficient:", allowance >= 285000000000000000);

        // Step 6: Simulate the exact failing call
        console.log("=== STEP 5: SIMULATE LSP CALL ===");
        vm.startBroadcast(deployerPrivateKey);

        // Try a minimal direct LSP call to see what happens
        console.log("Attempting direct LSP call...");

        try lsp.provideToSP(1, address(0)) {
            console.log("LSP call succeeded with minimal amount");
        } catch {
            console.log("LSP call failed even with minimal amount");
            console.log("This confirms LSP contract has an issue");
        }

        vm.stopBroadcast();

        // Step 7: Diagnosis and recommendations
        console.log("=== STEP 6: DIAGNOSIS ===");

        if (vaultNECTBalance == 0) {
            console.log("PRIMARY ISSUE: No NECT in vault");
            console.log("Strategy can't work without NECT tokens");
        } else {
            console.log("PRIMARY ISSUE: LSP contract call failing");
            console.log("   Possible causes:");
            console.log("   1. LSP contract is paused/disabled");
            console.log("   2. Wrong LSP address");
            console.log("   3. LSP requires minimum deposit amount");
            console.log("   4. LSP has other validation requirements");
        }

        console.log("=== RECOMMENDATIONS ===");
        console.log(
            "1. Check official Beraborrow docs for correct LSP address"
        );
        console.log("2. Try providing NECT to LSP manually outside vault");
        console.log("3. Consider bypassing LSP temporarily for testing");
        console.log("4. Contact Beraborrow team about LSP issues");
    }
}
