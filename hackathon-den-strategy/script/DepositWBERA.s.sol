// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DepositWBERA is Script {
    address constant VAULT_ADDRESS = 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1;
    address constant WBERA = 0x6969696969696969696969696969696969696969;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);
        IERC20 wbera = IERC20(WBERA);

        console.log("=== DEPOSITING 1 WBERA TO VAULT ===");
        console.log("User:", user);
        console.log("Vault:", VAULT_ADDRESS);
        console.log("WBERA:", WBERA);

        // Check user's WBERA balance
        uint256 userBalance = wbera.balanceOf(user);
        console.log("User WBERA Balance:", userBalance);

        uint256 depositAmount = 1 ether; // 1 WBERA
        console.log("Deposit Amount:", depositAmount);

        require(userBalance >= depositAmount, "Insufficient WBERA balance");

        // Approve vault to spend WBERA
        console.log("Approving vault to spend WBERA...");
        wbera.approve(VAULT_ADDRESS, depositAmount);

        // Check allowance
        uint256 allowance = wbera.allowance(user, VAULT_ADDRESS);
        console.log("Allowance set:", allowance);

        // Deposit to vault
        console.log("Depositing to vault...");
        uint256 shares = vault.deposit(depositAmount, user);

        console.log("DEPOSIT SUCCESS!");
        console.log("Shares received:", shares);

        // Check vault balances after deposit
        console.log("=== POST-DEPOSIT STATUS ===");
        console.log("Vault WBERA Balance:", wbera.balanceOf(VAULT_ADDRESS));
        console.log("User Vault Shares:", vault.balanceOf(user));
        console.log("Vault Total Supply:", vault.totalSupply());

        // Check user position
        (uint256 collateral, uint256 debt, uint256 userShares) = vault
            .getUserPosition(user);
        console.log("User Collateral:", collateral);
        console.log("User Debt:", debt);
        console.log("User Shares:", userShares);

        // Check strategy balances
        (uint256 lspBalance, uint256 poolBalance, uint256 total) = vault
            .getStrategyBalances();
        console.log("LSP Balance (40%):", lspBalance);
        console.log("Pool Balance (60%):", poolBalance);
        console.log("Total Strategy Balance:", total);

        vm.stopBroadcast();
    }
}
