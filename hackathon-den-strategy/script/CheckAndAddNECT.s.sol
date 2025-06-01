// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CheckAndAddNECT is Script {
    address constant VAULT_ADDRESS = 0x697B590397c519c5ed1AbDBEa452F097Df9a9dc1;
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3; // Official NECT

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        IERC20 nect = IERC20(NECT_TOKEN);

        console.log("=== CHECKING NECT AVAILABILITY ===");
        console.log("NECT Address:", NECT_TOKEN);
        console.log("User:", user);
        console.log("Vault:", VAULT_ADDRESS);

        // Check NECT contract
        try IERC20Metadata(NECT_TOKEN).name() returns (string memory name) {
            console.log("NECT Name:", name);
        } catch {
            console.log("NECT contract call failed");
        }

        // Check user NECT balance
        uint256 userBalance = nect.balanceOf(user);
        console.log("Your NECT Balance:", userBalance);

        if (userBalance > 0) {
            console.log("You have NECT! Transferring to vault...");

            // Transfer NECT to vault for strategy
            uint256 transferAmount = userBalance;
            nect.transfer(VAULT_ADDRESS, transferAmount);

            console.log("Transferred NECT to vault:", transferAmount);
        } else {
            console.log("No NECT tokens found");
            console.log("Options:");
            console.log("1. Get NECT from Beraborrow by borrowing");
            console.log("2. Get NECT from a DEX");
            console.log("3. Implement borrowing functionality");
        }

        // Check vault NECT balance
        uint256 vaultBalance = nect.balanceOf(VAULT_ADDRESS);
        console.log("Vault NECT Balance:", vaultBalance);

        vm.stopBroadcast();
    }
}
