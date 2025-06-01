// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DeployBeraVault is Script {
    // Berachain Mainnet Contract Addresses (PROPERLY CHECKSUMMED)
    address constant WBERA = 0x6969696969696969696969696969696969696969;
    address constant BORROWER_OPERATIONS =
        0x25378B1f162BF1FD30c71F8c1aC5e2dDCf5e3b34;
    address constant DEN_MANAGER = 0x5C9B6E1b2ac530dBD3d48D41E18B00A24D44ADB0;
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant LSP = 0x597877Ccf65be938BD214C4c46907669e3E62128;

    // YOUR TARGET POOL (60% allocation)
    address constant TARGET_POOL = 0x9A3549ef882584a687C1FF1843e3B3C07a2A0cB2;

    // Pool router (can be updated later if needed)
    address constant POOL_ROUTER = 0x0000000000000000000000000000000000000000;

    BeraStrategyVault public vault;

    function setUp() public {
        console2.log("Setting up BeraStrategyVault deployment...");
        console2.log("Deployer:", msg.sender);
        console2.log("Chain ID:", block.chainid);
        console2.log("Target Pool:", TARGET_POOL);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Starting deployment...");
        console2.log("Deployer address:", deployer);
        console2.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the vault
        console2.log("Deploying BeraStrategyVault...");
        vault = new BeraStrategyVault(
            IERC20(WBERA),
            "Bera Risk-Adjusted Yield Vault",
            "BRAYV",
            deployer // Owner
        );

        console2.log("Vault deployed at:", address(vault));

        // 2. Initialize the vault with 40% LSP / 60% Pool strategy
        console2.log("Initializing vault with strategy...");
        vault.initialize(
            BORROWER_OPERATIONS,
            DEN_MANAGER,
            NECT_TOKEN,
            LSP,
            TARGET_POOL, // Your high-yield pool (60%)
            POOL_ROUTER
        );

        console2.log("Vault initialized successfully!");

        vm.stopBroadcast();

        // 3. Verify deployment
        _verifyDeployment();

        // 4. Test strategy parameters
        _testStrategyParameters();

        // 5. Log comprehensive summary
        _logDeploymentSummary(deployer);
    }

    function _verifyDeployment() internal view {
        console2.log("Verifying deployment...");

        require(bytes(vault.name()).length > 0, "Name not set");
        require(bytes(vault.symbol()).length > 0, "Symbol not set");
        require(address(vault.asset()) == WBERA, "Asset mismatch");
        require(vault.owner() != address(0), "Owner not set");
        require(vault.nectToken() == NECT_TOKEN, "NECT token mismatch");
        require(vault.liquidStabilityPool() == LSP, "LSP mismatch");
        require(vault.targetPool() == TARGET_POOL, "Target pool mismatch");

        console2.log("All verification checks passed!");
    }

    function _testStrategyParameters() internal view {
        console2.log("Testing strategy parameters...");

        // Test allocation percentages
        uint256[2] memory allocation = vault.getStrategyAllocation();
        require(allocation[0] == 40e16, "LSP allocation incorrect");
        require(allocation[1] == 60e16, "Pool allocation incorrect");

        // Test risk parameters
        require(vault.TARGET_LTV() == 75e16, "Target LTV incorrect");
        require(vault.MAX_LTV() == 85e16, "Max LTV incorrect");
        require(vault.MIN_LTV() == 65e16, "Min LTV incorrect");

        console2.log("Strategy parameters validated!");
    }

    function _logDeploymentSummary(address deployer) internal view {
        console2.log("");
        console2.log("DEPLOYMENT SUMMARY");
        console2.log("=====================================");
        console2.log("Network: Berachain Mainnet");
        console2.log("Vault Address:", address(vault));
        console2.log("Deployer:", deployer);
        console2.log("Asset: WBERA");
        console2.log("Strategy: 40% LSP + 60% Target Pool");
        console2.log("Target LTV: 75%");
        console2.log("LSP Address:", vault.liquidStabilityPool());
        console2.log("Target Pool:", vault.targetPool());
        console2.log("=====================================");
        console2.log("");

        console2.log("STRATEGY FEATURES:");
        console2.log(
            "- 40% NECT to Liquid Stability Pool (stable yield + liquidation rewards)"
        );
        console2.log("- 60% NECT to Target Pool (high-yield strategy)");
        console2.log("- Automated yield harvesting from both strategies");
        console2.log("- Risk-adjusted position sizing");
        console2.log("- Emergency exit mechanisms");
        console2.log("- Automatic rebalancing");
        console2.log("");

        console2.log("NEXT STEPS:");
        console2.log("1. Vault deployed and initialized");
        console2.log("2. Fund vault for testing: vault.deposit()");
        console2.log("3. Monitor strategy execution");
        console2.log("4. Test rebalancing: vault.rebalance()");
        console2.log("5. Harvest rewards: vault.harvestAllRewards()");
        console2.log("");

        console2.log("MANAGEMENT FUNCTIONS:");
        console2.log("- vault.harvestLSPRewards() - Claim LSP rewards");
        console2.log("- vault.harvestPoolRewards() - Claim pool rewards");
        console2.log("- vault.rebalance() - Rebalance allocations");
        console2.log("- vault.getStrategyBalances() - Check balances");
        console2.log("- vault.emergencyExitAll() - Emergency exit");
    }
}
