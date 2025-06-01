// script/InteractWithVault.s.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract InteractWithVault is Script {
    // UPDATE THIS WITH YOUR DEPLOYED VAULT ADDRESS
    address constant VAULT_ADDRESS = 0x743f775F643Da36144Ae0014bD8EcE36130EE4E3; // Replace when deployed

    // Berachain addresses
    address constant WBERA = 0x7507C1dC16935b82698E4C63f2746A5fCf994df8;

    BeraStrategyVault public vault;
    IERC20 public wbera;

    function setUp() public {
        vault = BeraStrategyVault(VAULT_ADDRESS);
        wbera = IERC20(WBERA);

        console.log("=== BeraStrategyVault Interaction ===");
        console.log("Vault Address:", VAULT_ADDRESS);
        console.log("WBERA Address:", WBERA);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Choose interaction type via environment variable
        string memory action = vm.envOr("ACTION", string("info"));

        if (keccak256(bytes(action)) == keccak256(bytes("deposit"))) {
            _deposit(user);
        } else if (keccak256(bytes(action)) == keccak256(bytes("withdraw"))) {
            _withdraw(user);
        } else if (keccak256(bytes(action)) == keccak256(bytes("harvest"))) {
            _harvest();
        } else if (keccak256(bytes(action)) == keccak256(bytes("rebalance"))) {
            _rebalance();
        } else if (keccak256(bytes(action)) == keccak256(bytes("emergency"))) {
            _emergency();
        } else {
            _displayInfo(user);
        }

        vm.stopBroadcast();
    }

    function _deposit(address user) internal {
        uint256 amount = vm.envOr("AMOUNT", uint256(1 ether)); // Default 1 BERA

        console.log("=== DEPOSITING TO VAULT ===");
        console.log("User:", user);
        console.log("Amount:", amount);

        // Check user balance
        uint256 userBalance = wbera.balanceOf(user);
        console.log("User WBERA Balance:", userBalance);

        require(userBalance >= amount, "Insufficient WBERA balance");

        // Approve vault to spend WBERA
        wbera.approve(VAULT_ADDRESS, amount);
        console.log("Approved vault to spend WBERA");

        // Deposit to vault
        uint256 shares = vault.deposit(amount, user);
        console.log("Deposited successfully!");
        console.log("Shares received:", shares);

        _displayInfo(user);
    }

    function _withdraw(address user) internal {
        uint256 shares = vm.envOr("SHARES", uint256(0));

        console.log("=== WITHDRAWING FROM VAULT ===");
        console.log("User:", user);

        uint256 userShares = vault.balanceOf(user);
        console.log("User shares:", userShares);

        if (shares == 0) {
            shares = userShares; // Withdraw all if no amount specified
        }

        require(shares <= userShares, "Insufficient shares");

        console.log("Withdrawing shares:", shares);

        // Withdraw from vault
        uint256 assets = vault.redeem(shares, user, user);
        console.log("Withdrawal successful!");
        console.log("Assets received:", assets);

        _displayInfo(user);
    }

    function _harvest() internal {
        console.log("=== HARVESTING REWARDS ===");

        // Harvest LSP rewards
        (uint256 pollenEarned, uint256 collateralEarned) = vault
            .harvestLSPRewards();

        console.log("LSP Rewards - Pollen:");
        console.log(pollenEarned);
        console.log("Collateral:");
        console.log(collateralEarned);

        // Harvest Pool rewards
        uint256 poolRewards = vault.harvestPoolRewards();
        console.log("Pool Rewards:");
        console.log(poolRewards);

        // Harvest all
        uint256 totalHarvested = vault.harvestAllRewards();
        console.log("Total Harvested:");
        console.log(totalHarvested);
    }

    function _rebalance() internal {
        console.log("=== REBALANCING VAULT ===");

        bool shouldRebalance = vault.shouldRebalance();
        console.log("Should rebalance:", shouldRebalance);

        if (shouldRebalance) {
            vault.rebalance();
            console.log("Rebalancing completed!");
        } else {
            console.log("No rebalancing needed");
        }

        _displayStrategyInfo();
    }

    function _emergency() internal {
        console.log("=== EMERGENCY FUNCTIONS ===");
        console.log("WARNING: This will activate emergency mode!");

        // Only vault owner can do this
        vault.activateEmergencyMode("Manual emergency activation");
        console.log("Emergency mode activated");

        vault.emergencyExitAll();
        console.log("Emergency exit completed");
    }

    function _displayInfo(address user) internal view {
        console.log("=== VAULT INFO ===");
        console.log("Vault Name:");
        console.log(vault.name());
        console.log("Vault Symbol:");
        console.log(vault.symbol());
        console.log("Total Assets:");
        console.log(vault.totalAssets());
        console.log("Total Supply:");
        console.log(vault.totalSupply());
        console.log("Total Yield Earned:");
        console.log(vault.totalYieldEarned());
        console.log("Total Managed Debt:");
        console.log(vault.totalManagedDebt());
        console.log("Emergency Mode:");
        console.log(vault.emergencyMode());

        console.log("=== USER INFO ===");
        console.log("User Address:");
        console.log(user);
        console.log("User Shares:");
        console.log(vault.balanceOf(user));
        console.log("User WBERA Balance:");
        console.log(wbera.balanceOf(user));

        (uint256 collateral, uint256 debt, uint256 shares) = vault
            .getUserPosition(user);
        console.log("User Collateral:");
        console.log(collateral);
        console.log("User Debt:");
        console.log(debt);
        console.log("User Shares:");
        console.log(shares);

        _displayStrategyInfo();
    }

    function _displayStrategyInfo() internal view {
        console.log("\n=== STRATEGY INFO ===");

        // Strategy allocation
        uint256[2] memory allocation = vault.getStrategyAllocation();
        console.log("LSP Allocation:", allocation[0]);
        console.log("Pool Allocation:", allocation[1]);

        // Current balances
        (uint256 lsp, uint256 pool, uint256 total) = vault
            .getStrategyBalances();
        console.log("LSP Balance:", lsp);
        console.log("Pool Balance:", pool);
        console.log("Total Balance:", total);

        // Current allocation percentages
        (uint256 lspPercent, uint256 poolPercent) = vault
            .getCurrentAllocation();
        console.log("Current LSP %:", lspPercent);
        console.log("Current Pool %:", poolPercent);

        // Strategy parameters
        console.log("Target LTV:", vault.TARGET_LTV());
        console.log("Max LTV:", vault.MAX_LTV());
        console.log("Min LTV:", vault.MIN_LTV());
        console.log("Liquidation Probability:", vault.liquidationProbability());

        // Contract addresses
        console.log("Target Pool:", vault.targetPool());
        console.log("LSP Address:", vault.liquidStabilityPool());
        console.log("NECT Token:", vault.nectToken());
    }
}
