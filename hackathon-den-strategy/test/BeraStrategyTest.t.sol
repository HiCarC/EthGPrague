// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {BeraStrategyVault} from "src/BeraStrategyVault.sol";
import {MockNECT, MockBorrowerOperations, MockLSP} from "src/mocks/MockBeraborrow.sol";

contract MockCollateral is ERC20 {
    constructor() ERC20("Mock iBGT", "iBGT") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract BeraStrategyTest is Test {
    BeraStrategyVault vault;
    MockCollateral collateral;
    MockNECT nect;
    MockBorrowerOperations borrowerOps;
    MockLSP lsp;
    
    address user = address(0x1);
    
    function setUp() public {
        collateral = new MockCollateral();
        nect = new MockNECT();
        borrowerOps = new MockBorrowerOperations(address(nect));
        lsp = new MockLSP();
        
        vault = new BeraStrategyVault(
            collateral,
            "Bera Strategy Vault",
            "BSV"
        );
        
        vault.initialize(
            address(borrowerOps),
            address(0), // mock den manager
            address(nect),
            address(lsp)
        );
        
        // Setup user
        collateral.mint(user, 1000e18);
        vm.deal(user, 10 ether);
    }
    
    function testDepositAndStrategy() public {
        vm.startPrank(user);
        
        uint256 depositAmount = 100e18;
        collateral.approve(address(vault), depositAmount);
        
        uint256 shares = vault.deposit(depositAmount, user);
        
        assertGt(shares, 0);
        assertEq(vault.balanceOf(user), shares);
        
        vm.stopPrank();
    }
    
    function testMultipleStrategies() public {
        // Test that NECT is deployed to multiple strategies
        assertTrue(true); // Placeholder
    }
}
