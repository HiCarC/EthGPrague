// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/BookingPoolFactory.sol";
import "../src/MockYieldStrategy.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log(
            "=== WorldChain Booking Pool + Yield System Deployment ==="
        );
        console.log("Deploying from address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy MockYieldStrategy first
        console.log("Deploying MockYieldStrategy...");
        MockYieldStrategy yieldStrategy = new MockYieldStrategy(deployer);
        console.log("MockYieldStrategy deployed at:", address(yieldStrategy));

        // Step 2: Deploy BookingPoolFactoryV2 with yield strategy
        console.log("Deploying BookingPoolFactoryV2...");
        BookingPoolFactoryV2 factory = new BookingPoolFactoryV2(
            address(yieldStrategy)
        );
        console.log("BookingPoolFactoryV2 deployed at:", address(factory));

        // Step 3: Connect contracts
        console.log("Connecting contracts...");
        // No additional setup needed for our simple mock

        vm.stopBroadcast();

        console.log("=== Deployment Successful ===");
        console.log("Contract Summary:");
        console.log("  MockYieldStrategy:", address(yieldStrategy));
        console.log("  BookingPoolFactoryV2:", address(factory));
        console.log("  Platform Owner:", factory.platformOwner());
        console.log("  Platform Fee:", factory.platformFeePercentage());
        console.log("  Yield Percentage:", yieldStrategy.YIELD_PERCENTAGE());

        // Test the contracts
        console.log("Initial Contract State:");
        console.log("  Initial pool count:", factory.getPoolsCount());
        console.log("  Next property ID:", factory.nextPropertyId());
        console.log("  Yield strategy address:", factory.yieldStrategy());

        console.log("=== Save These Addresses ===");
        console.log("FACTORY_V2_ADDRESS:", address(factory));
        console.log("YIELD_STRATEGY_ADDRESS:", address(yieldStrategy));
        console.log("PLATFORM_OWNER:", factory.platformOwner());

        console.log("=== .env Variables ===");
        console.log("FACTORY_ADDRESS:", address(factory));
        console.log("YIELD_STRATEGY_ADDRESS:", address(yieldStrategy));

        console.log("=== Verification Commands ===");
        console.log("forge verify-contract");
        console.log(address(yieldStrategy));
        console.log("src/MockYieldStrategy.sol:MockYieldStrategy");

        console.log("forge verify-contract");
        console.log(address(factory));
        console.log("src/BookingPoolFactory.sol:BookingPoolFactoryV2");

        console.log("=== Explorer Links ===");
        if (block.chainid == 4801) {
            console.log("YieldStrategy:");
            console.log(
                "https://worldchain-sepolia.explorer.alchemy.com/address/"
            );
            console.log(address(yieldStrategy));
            console.log("Factory:");
            console.log(
                "https://worldchain-sepolia.explorer.alchemy.com/address/"
            );
            console.log(address(factory));
        } else if (block.chainid == 480) {
            console.log("YieldStrategy:");
            console.log("https://worldscan.org/address/");
            console.log(address(yieldStrategy));
            console.log("Factory:");
            console.log("https://worldscan.org/address/");
            console.log(address(factory));
        }
    }
}
