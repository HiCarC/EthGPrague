// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract TestWBERAContract is Script {
    address constant WBERA = 0x7507C1dC16935b82698E4C63f2746A5fCf994df8;

    function run() public view {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console.log("=== COMPREHENSIVE WBERA CONTRACT TEST ===");
        console.log("WBERA Address:", WBERA);
        console.log("User Address:", user);
        console.log("");

        // Test 1: Contract existence
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(WBERA)
        }
        console.log("1. Contract Code Size:", codeSize);

        if (codeSize == 0) {
            console.log("❌ NO CONTRACT AT THIS ADDRESS!");
            return;
        }

        // Test 2: Basic metadata calls
        console.log("2. Testing metadata calls...");
        try IERC20Metadata(WBERA).name() returns (string memory name) {
            console.log("✅ name():", name);
        } catch {
            console.log("❌ name() failed");
        }

        try IERC20Metadata(WBERA).symbol() returns (string memory symbol) {
            console.log("✅ symbol():", symbol);
        } catch {
            console.log("❌ symbol() failed");
        }

        try IERC20Metadata(WBERA).decimals() returns (uint8 decimals) {
            console.log("✅ decimals():", decimals);
        } catch {
            console.log("❌ decimals() failed");
        }

        // Test 3: Supply calls
        console.log("3. Testing supply calls...");
        try IERC20(WBERA).totalSupply() returns (uint256 supply) {
            console.log("✅ totalSupply():", supply);
        } catch {
            console.log("❌ totalSupply() failed");
        }

        // Test 4: Balance calls with different addresses
        console.log("4. Testing balanceOf() with different addresses...");

        // Test with zero address
        try IERC20(WBERA).balanceOf(address(0)) returns (uint256 balance) {
            console.log("✅ balanceOf(0x0):", balance);
        } catch {
            console.log("❌ balanceOf(0x0) failed");
        }

        // Test with WBERA contract itself
        try IERC20(WBERA).balanceOf(WBERA) returns (uint256 balance) {
            console.log("✅ balanceOf(WBERA):", balance);
        } catch {
            console.log("❌ balanceOf(WBERA) failed");
        }

        // Test with user address (this is failing)
        try IERC20(WBERA).balanceOf(user) returns (uint256 balance) {
            console.log("✅ balanceOf(user):", balance);
        } catch {
            console.log("❌ balanceOf(user) FAILED - This is the problem!");
        }

        // Test with a random address
        address randomAddr = 0x1234567890123456789012345678901234567890;
        try IERC20(WBERA).balanceOf(randomAddr) returns (uint256 balance) {
            console.log("✅ balanceOf(random):", balance);
        } catch {
            console.log("❌ balanceOf(random) failed");
        }

        console.log("");
        console.log("=== CONCLUSION ===");
        console.log("If balanceOf(user) fails but others work,");
        console.log(
            "there might be access control or the user address is blocked."
        );
        console.log("");
        console.log("ALTERNATIVE SOLUTIONS:");
        console.log("1. Use NECT as vault asset instead of WBERA");
        console.log("2. Get WBERA from a DEX or faucet");
        console.log("3. Use a different address");
        console.log("4. Find the real WBERA contract address");
    }
}
