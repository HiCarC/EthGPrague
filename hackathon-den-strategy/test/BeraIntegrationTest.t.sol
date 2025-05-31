// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {TestSetup} from "./TestSetup.t.sol";

contract BeraIntegrationTest is TestSetup {
    function testBeraContractsExist() public {
        // Test that all contracts are deployed and accessible
        assertTrue(address(wberaDenManager) != address(0));
        assertTrue(address(wberaSortedDens) != address(0));
        assertTrue(address(wberaCollateralVault) != address(0));
        assertTrue(address(borrowerOperations) != address(0));
    }
    
    function testCanReadBeraData() public {
        // Test reading data from live contracts
        uint256 minNetDebt = borrowerOperations.minNetDebt();
        assertTrue(minNetDebt > 0);
        
        // Test reading collateral data
        uint256 totalStakes = wberaDenManager.totalStakes();
        // This might be 0 on testnet, so just check it doesn't revert
    }
    
    function testLSPExists() public {
        // Test the Liquid Stability Pool
        address lspAsset = address(wberaCollateralVault.asset());
        assertTrue(lspAsset != address(0));
    }
}
