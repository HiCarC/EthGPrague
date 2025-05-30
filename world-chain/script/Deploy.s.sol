// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/BookingPoolFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        BookingPoolFactory factory = new BookingPoolFactory();

        console.log("BookingPoolFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
