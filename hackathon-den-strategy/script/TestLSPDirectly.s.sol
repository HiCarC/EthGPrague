// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface ILSPTest {
    function provideToSP(uint256 _amount, address _frontEndTag) external;
}

contract TestLSPDirectly is Script {
    address constant NECT_TOKEN = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant LSP_ADDRESS = 0x9158d1b0c9Cc4EC7640EAeF0522f710dADeE9a1B;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console.log("=== TESTING LSP DIRECTLY ===");
        console.log("LSP Address:", LSP_ADDRESS);
        console.log("User:", user);

        IERC20 nect = IERC20(NECT_TOKEN);
        ILSPTest lsp = ILSPTest(LSP_ADDRESS);

        // Check user NECT balance
        uint256 userBalance = nect.balanceOf(user);
        console.log("User NECT Balance:", userBalance);

        if (userBalance == 0) {
            console.log("User has no NECT - can't test LSP directly");
            return;
        }

        vm.startBroadcast(deployerPrivateKey);

        // Try tiny amount first
        uint256 testAmount = 1; // 1 wei
        console.log("Testing LSP with tiny amount:", testAmount);

        nect.approve(LSP_ADDRESS, testAmount);

        try lsp.provideToSP(testAmount, address(0)) {
            console.log("LSP works with tiny amount!");
        } catch {
            console.log("LSP fails even with tiny amount - LSP has issues");
        }

        vm.stopBroadcast();
    }
}
