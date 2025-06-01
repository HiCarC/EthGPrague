// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface ILiquidStabilityPoolTest {
    function provideToSP(uint256 _amount, address _frontEndTag) external;
}

contract TestSmallLSPDeposit is Script {
    address constant LSP = 0x597877Ccf65be938BD214C4c46907669e3E62128;
    address constant NECT = 0x1cE0a25D13CE4d52071aE7e02Cf1F6606F4C79d3;
    address constant USER = 0x504b635B7E22F8DF7d037cf31639811AE583E9f0;

    function run() public {
        vm.startBroadcast();

        console.log("=== TESTING SMALL DIRECT LSP DEPOSIT ===");

        uint256 userBalance = IERC20(NECT).balanceOf(USER);
        console.log("User NECT Balance:", userBalance);

        if (userBalance == 0) {
            console.log("User has no NECT! Cannot test.");
            vm.stopBroadcast();
            return;
        }

        // Try very small amount: 0.001 NECT
        uint256 testAmount = 1000000000000000; // 0.001 NECT

        console.log("Testing amount:", testAmount);

        // Approve LSP
        IERC20(NECT).approve(LSP, testAmount);
        console.log("Approved LSP for amount:", testAmount);

        // Try the deposit directly
        try ILiquidStabilityPoolTest(LSP).provideToSP(testAmount, address(0)) {
            console.log("SUCCESS! Direct LSP deposit worked!");
        } catch {
            console.log("FAILED: Even direct LSP deposit failed");

            // Try with a different frontEndTag
            try ILiquidStabilityPoolTest(LSP).provideToSP(testAmount, USER) {
                console.log("SUCCESS! LSP deposit worked with frontEndTag!");
            } catch {
                console.log("FAILED: LSP deposit failed even with frontEndTag");
            }
        }

        vm.stopBroadcast();
    }
}
