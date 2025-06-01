// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";

contract InitializeVault is Script {
    // Your deployed vault address
    address constant VAULT_ADDRESS = 0x3be8F5276D94F1a65c6606895BeA4eD56BB45A05;

    // Berachain contract addresses (need to verify these)
    address constant BORROWER_OPERATIONS =
        0xDB32cA8f3bB099A76D4Ec713a2c2AACB3d8e84B9;
    address constant DEN_MANAGER = 0x9A3549ef882584a687C1FF1843e3B3C07a2A0cB2; // WETH DenManager
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant LSP = 0x597877Ccf65be938BD214C4c46907669e3E62128; // LiquidStabilityPool Proxy
    address constant TARGET_POOL = 0x9A3549ef882584a687C1FF1843e3B3C07a2A0cB2; // WETH DenManager (your target)
    address constant POOL_ROUTER = 0x3A7ED65b35fDfaaCC9F0E881846A9F4E57181446; // LSPRouter

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        BeraStrategyVault vault = BeraStrategyVault(VAULT_ADDRESS);

        console.log("Initializing vault...");

        vault.initialize(
            BORROWER_OPERATIONS,
            DEN_MANAGER,
            NECT_TOKEN,
            LSP,
            TARGET_POOL,
            POOL_ROUTER
        );

        console.log("Vault initialized successfully!");

        vm.stopBroadcast();
    }
}
