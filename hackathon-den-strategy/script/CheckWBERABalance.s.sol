// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract CheckWBERABalance is Script {
    address constant WBERA = 0x6969696969696969696969696969696969696969;

    function run() public view {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console.log("=== CHECKING WBERA BALANCE ===");
        console.log("User Address:", user);
        console.log("WBERA Address:", WBERA);

        IERC20 wbera = IERC20(WBERA);
        uint256 balance = wbera.balanceOf(user);

        console.log("Your WBERA Balance:", balance);
        console.log("Balance in BERA:", balance / 1e18);

        if (balance >= 1 ether) {
            console.log("You have enough WBERA to deposit 1 BERA!");
        } else {
            console.log(
                "You need more WBERA. Current balance is insufficient."
            );
            console.log("You need at least 1 BERA (1000000000000000000 wei)");
        }
    }
}
