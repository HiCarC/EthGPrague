// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/BookingPoolFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== WorldCoin Booking Pool System Deployment ===");
        console.log("Deploying from address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BookingPoolFactoryV2 with enhanced features
        BookingPoolFactoryV2 factory = new BookingPoolFactoryV2();

        console.log("=== Deployment Successful ===");
        console.log("BookingPoolFactoryV2 deployed at:", address(factory));
        console.log("Platform Owner:", factory.platformOwner());
        console.log("Platform Fee:", factory.platformFeePercentage(), "%");
        console.log("Block number:", block.number);

        // Test the factory by reading basic info
        console.log("Initial pool count:", factory.getPoolsCount());
        console.log("Next property ID:", factory.nextPropertyId());

        vm.stopBroadcast();

        console.log("=== Save These Addresses ===");
        console.log("FACTORY_V2_ADDRESS=", address(factory));
        console.log("PLATFORM_OWNER=", factory.platformOwner());
        console.log("");
        console.log("=== Verification Command ===");
        console.log(
            "forge verify-contract",
            address(factory),
            "src/BookingPoolFactory.sol:BookingPoolFactoryV2 --chain-id",
            block.chainid
        );
        console.log("");
        console.log("=== Explorer Link ===");
        if (block.chainid == 4801) {
            console.log(
                "https://worldchain-sepolia.explorer.alchemy.com/address/",
                address(factory)
            );
        } else if (block.chainid == 480) {
            console.log("https://worldscan.org/address/", address(factory));
        }
    }
}
