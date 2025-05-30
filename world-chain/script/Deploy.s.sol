// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/BookingPoolFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying BookingPoolFactoryV2 from address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BookingPoolFactoryV2
        BookingPoolFactoryV2 factory = new BookingPoolFactoryV2();

        console.log("=== Deployment Successful ===");
        console.log("BookingPoolFactoryV2 deployed at:", address(factory));
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);

        // Test the factory by reading basic info
        console.log("Initial pool count:", factory.getPoolsCount());

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("Save this address for frontend integration:");
        console.log("FACTORY_V2_ADDRESS=", address(factory));
    }
}
