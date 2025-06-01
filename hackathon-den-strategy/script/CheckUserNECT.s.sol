// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CheckUserNECT is Script {
    address constant VAULT_ADDRESS = 0x9D0b45d6b6D5BEd077e52f1706BE49E1D402d2d2; // Updated vault
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3; // Official NECT

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console.log("=== CHECKING USER NECT BALANCE ===");
        console.log("NECT Address:", NECT_TOKEN);
        console.log("User:", user);
        console.log("Vault:", VAULT_ADDRESS);

        IERC20 nect = IERC20(NECT_TOKEN);

        // Check NECT contract
        try IERC20Metadata(NECT_TOKEN).name() returns (string memory name) {
            console.log("NECT Name:", name);
        } catch {
            console.log("NECT contract call failed");
        }

        // Check user NECT balance
        uint256 userBalance = nect.balanceOf(user);
        console.log("Your NECT Balance:", userBalance);
        console.log("Your NECT (readable):", userBalance / 1e18);

        // Check vault NECT balance
        uint256 vaultBalance = nect.balanceOf(VAULT_ADDRESS);
        console.log("Vault NECT Balance:", vaultBalance);
        console.log("Vault NECT (readable):", vaultBalance / 1e18);

        if (userBalance > 0) {
            console.log("=== TRANSFERRING NECT TO VAULT ===");

            vm.startBroadcast(deployerPrivateKey);

            // Transfer NECT to vault for strategy
            uint256 transferAmount = userBalance;
            nect.transfer(VAULT_ADDRESS, transferAmount);

            vm.stopBroadcast();

            console.log("Transferred NECT to vault:", transferAmount);
            console.log("Now try depositing WBERA again!");
        } else {
            console.log("=== NO NECT FOUND ===");
            console.log("Options:");
            console.log("1. Get NECT from Beraborrow by borrowing");
            console.log("2. Get NECT from a DEX");
            console.log("3. Enable emergency mode to bypass strategy");
        }
    }
}
