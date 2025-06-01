// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface ILSPDiagnostic {
    function getTotalNECTDeposits() external view returns (uint256);
    function isOperational() external view returns (bool);
    function getDepositorsCount() external view returns (uint256);
    function getDepositorNECTDeposit(
        address depositor
    ) external view returns (uint256);
    function DECIMAL_PRECISION() external view returns (uint256);
}

contract DiagnoseLSP is Script {
    address constant LSP = 0x597877Ccf65be938BD214C4c46907669e3E62128;
    address constant NECT = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant VAULT = 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1;

    function run() public view {
        console.log("=== LSP DIAGNOSTIC ===");
        console.log("LSP Address:", LSP);
        console.log("NECT Address:", NECT);
        console.log("Vault Address:", VAULT);

        // Check NECT balance of vault
        uint256 vaultNECT = IERC20(NECT).balanceOf(VAULT);
        console.log("Vault NECT Balance:", vaultNECT);

        // Check if vault has approval
        uint256 allowance = IERC20(NECT).allowance(VAULT, LSP);
        console.log("Vault->LSP Allowance:", allowance);

        // Try LSP diagnostic calls
        ILSPDiagnostic lsp = ILSPDiagnostic(LSP);

        try lsp.getTotalNECTDeposits() returns (uint256 total) {
            console.log("LSP Total NECT Deposits:", total);
        } catch {
            console.log("LSP getTotalNECTDeposits() failed");
        }

        try lsp.isOperational() returns (bool operational) {
            console.log("LSP Operational:", operational);
        } catch {
            console.log("LSP isOperational() failed");
        }

        try lsp.getDepositorsCount() returns (uint256 count) {
            console.log("LSP Depositors Count:", count);
        } catch {
            console.log("LSP getDepositorsCount() failed");
        }

        try lsp.DECIMAL_PRECISION() returns (uint256 precision) {
            console.log("LSP Decimal Precision:", precision);
        } catch {
            console.log("LSP DECIMAL_PRECISION() failed");
        }

        // Check if LSP has NECT balance (shouldn't be zero if it's working)
        uint256 lspNECT = IERC20(NECT).balanceOf(LSP);
        console.log("LSP NECT Balance:", lspNECT);

        // Test smaller amounts
        console.log("=== SUGGESTED TESTS ===");
        console.log("1. Try smaller amount: 1000000000000000 (0.001 NECT)");
        console.log("2. Check if LSP is paused/operational");
        console.log("3. Try with different frontHint (non-zero address)");
    }
}
