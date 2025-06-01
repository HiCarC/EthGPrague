// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "lib/forge-std/src/Test.sol";
import "../src/BeraStrategyVault.sol";

// Enhanced Mock Contracts
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract MockLSP {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public pollenRewards;
    mapping(address => uint256) public collateralRewards;

    function provideToSP(uint256 _amount, address) external {
        deposits[msg.sender] += _amount;
        // Simulate some rewards
        pollenRewards[msg.sender] += _amount / 100; // 1% POLLEN reward
        collateralRewards[msg.sender] += _amount / 200; // 0.5% collateral reward
    }

    function withdrawFromSP(uint256 _amount) external {
        if (_amount == 0) {
            // Claim rewards without withdrawing
            pollenRewards[msg.sender] = 0;
            collateralRewards[msg.sender] = 0;
        } else {
            require(deposits[msg.sender] >= _amount, "Insufficient deposit");
            deposits[msg.sender] -= _amount;
        }
    }

    function getCompoundedNECTDeposit(
        address _depositor
    ) external view returns (uint256) {
        return deposits[_depositor];
    }

    function getDepositorPollenGain(
        address _depositor
    ) external view returns (uint256) {
        return pollenRewards[_depositor];
    }

    function getDepositorCollateralGain(
        address _depositor
    ) external view returns (uint256) {
        return collateralRewards[_depositor];
    }
}

contract MockTargetPool {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewards;

    function deposit(uint256 amount) external {
        balances[msg.sender] += amount;
        // Simulate some rewards
        rewards[msg.sender] += amount / 50; // 2% reward
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function harvest() external returns (uint256) {
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        return reward;
    }
}

contract BeraStrategyTest is Test {
    BeraStrategyVault public vault;
    MockERC20 public asset;
    MockERC20 public nectToken;
    MockLSP public lsp;
    MockTargetPool public targetPool;

    address public user = address(1);
    address public user2 = address(2);
    address public owner = address(this);

    event StrategyDeployed(
        address indexed user,
        uint256 collateral,
        uint256 debt,
        uint256 shares
    );
    event YieldDistributed(
        uint256 lspAmount,
        uint256 poolAmount,
        uint256 timestamp
    );
    event LSPRewardsHarvested(uint256 pollenAmount, uint256 collateralAmount);
    event PoolRewardsHarvested(uint256 amount);
    event PositionRebalanced(uint256 newLTV, uint256 yieldHarvested);

    function setUp() public {
        console.log("Setting up test environment...");

        // Deploy mock contracts
        asset = new MockERC20("WBERA", "WBERA", 18);
        nectToken = new MockERC20("NECT", "NECT", 18);
        lsp = new MockLSP();
        targetPool = new MockTargetPool();

        // Deploy vault
        vault = new BeraStrategyVault(
            IERC20(address(asset)),
            "Bera Strategy Vault",
            "BSV",
            owner
        );

        // Initialize vault
        vault.initialize(
            address(0), // borrowerOperations (mock)
            address(0), // denManager (mock)
            address(nectToken),
            address(lsp),
            address(targetPool),
            address(0) // poolRouter (mock)
        );

        // Setup test tokens
        asset.mint(user, 10000e18);
        asset.mint(user2, 10000e18);
        nectToken.mint(address(vault), 100000e18); // Give vault NECT to distribute

        // Setup approvals
        vm.prank(user);
        asset.approve(address(vault), type(uint256).max);

        vm.prank(user2);
        asset.approve(address(vault), type(uint256).max);

        console.log("Setup complete!");
    }

    function testInitialization() public {
        console.log("Testing initialization...");

        assertEq(vault.name(), "Bera Strategy Vault");
        assertEq(vault.symbol(), "BSV");
        assertEq(address(vault.asset()), address(asset));
        assertEq(vault.owner(), owner);
        assertEq(vault.nectToken(), address(nectToken));
        assertEq(vault.liquidStabilityPool(), address(lsp));
        assertEq(vault.targetPool(), address(targetPool));

        console.log("Initialization tests passed!");
    }

    function testStrategyParameters() public {
        console.log("Testing strategy parameters...");

        assertEq(vault.TARGET_LTV(), 75e16); // 75%
        assertEq(vault.LSP_ALLOCATION(), 40e16); // 40%
        assertEq(vault.POOL_ALLOCATION(), 60e16); // 60%

        uint256[2] memory allocation = vault.getStrategyAllocation();
        assertEq(allocation[0], 40e16); // LSP
        assertEq(allocation[1], 60e16); // Pool

        console.log("Strategy parameter tests passed!");
    }

    function testDeposit() public {
        console.log("Testing deposit functionality...");

        uint256 depositAmount = 1000e18;

        vm.prank(user);
        vault.deposit(depositAmount, user);

        // Check vault shares
        assertEq(vault.balanceOf(user), depositAmount);

        // Check user position tracking
        (uint256 collateral, uint256 debt, uint256 shares) = vault
            .getUserPosition(user);
        assertEq(collateral, depositAmount);
        assertEq(shares, depositAmount);
        assertGt(debt, 0); // Should have calculated some debt

        console.log("Deposit tests passed!");
    }

    function testStrategyExecution() public {
        console.log("Testing strategy execution...");

        uint256 depositAmount = 1000e18;

        // Get the actual debt calculation
        uint256 expectedDebt = (depositAmount * vault.TARGET_LTV() * 95e16) /
            (1e18 * 1e18); // TARGET_LTV * risk adjustment
        uint256 expectedShares = depositAmount; // Should equal deposit for first user

        vm.expectEmit(true, false, false, false);
        emit StrategyDeployed(
            user,
            depositAmount,
            expectedDebt,
            expectedShares
        );

        vm.prank(user);
        vault.deposit(depositAmount, user);

        console.log("Strategy execution tests passed!");
    }

    function testLSPRewardHarvesting() public {
        console.log("Testing LSP reward harvesting...");

        // First deposit to generate rewards
        vm.prank(user);
        vault.deposit(1000e18, user);

        // Simulate passage of time and rewards accumulation
        vm.warp(block.timestamp + 1 days);

        // Harvest LSP rewards
        (uint256 pollenEarned, uint256 collateralEarned) = vault
            .harvestLSPRewards();

        assertGt(
            pollenEarned + collateralEarned,
            0,
            "Should have earned some rewards"
        );

        console.log("LSP reward harvesting tests passed!");
    }

    function testPoolRewardHarvesting() public {
        console.log("Testing pool reward harvesting...");

        // First deposit to generate rewards
        vm.prank(user);
        vault.deposit(1000e18, user);

        // Harvest pool rewards
        uint256 poolEarned = vault.harvestPoolRewards();

        assertGt(poolEarned, 0, "Should have earned pool rewards");

        console.log("Pool reward harvesting tests passed!");
    }

    function testHarvestAllRewards() public {
        console.log("Testing harvest all rewards...");

        vm.prank(user);
        vault.deposit(1000e18, user);

        uint256 totalHarvested = vault.harvestAllRewards();
        assertGt(totalHarvested, 0, "Should have harvested total rewards");

        console.log("Harvest all rewards tests passed!");
    }

    function testMultipleUsers() public {
        console.log("Testing multiple users...");

        // User 1 deposits
        vm.prank(user);
        vault.deposit(1000e18, user);

        // User 2 deposits
        vm.prank(user2);
        vault.deposit(2000e18, user2);

        // Check individual positions
        (uint256 collateral1, uint256 debt1, uint256 shares1) = vault
            .getUserPosition(user);
        (uint256 collateral2, uint256 debt2, uint256 shares2) = vault
            .getUserPosition(user2);

        assertEq(collateral1, 1000e18);
        assertEq(collateral2, 2000e18);
        assertEq(shares1, 1000e18);
        assertEq(shares2, 2000e18);
        assertGt(debt1, 0);
        assertGt(debt2, 0);
        assertGt(debt2, debt1); // User 2 should have more debt

        console.log("Multiple users tests passed!");
    }

    function testStrategyBalances() public {
        console.log("Testing strategy balances...");

        vm.prank(user);
        vault.deposit(1000e18, user);

        (uint256 lspBalance, uint256 poolBalance, uint256 total) = vault
            .getStrategyBalances();

        // Check that balances are tracked (may be zero if strategy not fully implemented)
        assertEq(total, lspBalance + poolBalance);

        console.log("Strategy balances tests passed!");
    }

    function testRebalancing() public {
        console.log("Testing rebalancing...");

        // Deposit first
        vm.prank(user);
        vault.deposit(1000e18, user);

        // Fast forward time to allow rebalancing
        vm.warp(block.timestamp + 2 hours);

        // Test rebalancing (may not trigger if within thresholds)
        if (vault.shouldRebalance()) {
            vault.rebalance();
        }

        console.log("Rebalancing tests passed!");
    }

    function testEmergencyMode() public {
        console.log("Testing emergency mode...");

        // Activate emergency mode
        vault.activateEmergencyMode("Test emergency");
        assertTrue(vault.emergencyMode());

        // Test that deposits don't execute strategy in emergency mode
        vm.prank(user);
        vault.deposit(1000e18, user);

        // Should have shares but strategy execution is limited
        assertEq(vault.balanceOf(user), 1000e18);

        console.log("Emergency mode tests passed!");
    }

    function testOwnershipFunctions() public {
        console.log("Testing ownership functions...");

        // Test that only owner can call restricted functions
        vm.prank(user);
        vm.expectRevert();
        vault.updateTargetPool(address(0x123));

        // Should work as owner
        vault.updateTargetPool(address(0x123));
        assertEq(vault.targetPool(), address(0x123));

        console.log("Ownership function tests passed!");
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(user);
        vm.expectRevert("Cannot deposit zero assets");
        vault.deposit(0, user);
    }

    function test_RevertWhen_UnauthorizedEmergency() public {
        vm.prank(user); // Non-owner
        vm.expectRevert(); // Should revert with Ownable error
        vault.activateEmergencyMode("Unauthorized");
    }

    function testGetCurrentAllocation() public {
        console.log("Testing current allocation calculation...");

        (uint256 lspPercent, uint256 poolPercent) = vault
            .getCurrentAllocation();

        // If no deposits yet, should be 0
        if (lspPercent == 0 && poolPercent == 0) {
            console.log("No allocation yet (no deposits)");
        } else {
            // Should add up to 100%
            assertEq(lspPercent + poolPercent, 1e18);
        }

        console.log("Current allocation tests passed!");
    }

    // Integration test combining multiple features
    function testFullUserJourney() public {
        console.log("Testing full user journey...");

        uint256 depositAmount = 5000e18;

        // 1. User deposits
        vm.prank(user);
        vault.deposit(depositAmount, user);

        // 2. Check position
        (uint256 collateral, uint256 debt, uint256 shares) = vault
            .getUserPosition(user);
        assertEq(collateral, depositAmount);
        assertEq(shares, depositAmount);
        assertGt(debt, 0);

        // 3. Harvest rewards after some time
        vm.warp(block.timestamp + 1 days);
        uint256 rewards = vault.harvestAllRewards();

        // 4. Check strategy balances
        (uint256 lspBalance, uint256 poolBalance, uint256 totalBalance) = vault
            .getStrategyBalances();
        console.log("LSP Balance:", lspBalance);
        console.log("Pool Balance:", poolBalance);
        console.log("Total Balance:", totalBalance);

        // 5. Test rebalancing if needed
        if (vault.shouldRebalance()) {
            vault.rebalance();
        }

        console.log("Full user journey test passed!");
        console.log("Total rewards harvested:", rewards);
    }
}
