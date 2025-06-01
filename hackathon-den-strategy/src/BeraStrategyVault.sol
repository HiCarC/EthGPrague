// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC4626} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

// 🔥 INTERFACES FOR BERABORROW & POOLS
interface ILiquidStabilityPool {
    function provideToSP(uint256 _amount, address _frontEndTag) external;
    function withdrawFromSP(uint256 _amount) external;
    function getCompoundedNECTDeposit(
        address _depositor
    ) external view returns (uint256);
    function getDepositorPollenGain(
        address _depositor
    ) external view returns (uint256);
    function getDepositorCollateralGain(
        address _depositor
    ) external view returns (uint256);
}

interface IBorrowerOperations {
    function openDen(
        uint256 _maxFeePercentage,
        uint256 _nectAmount,
        address _upperHint,
        address _lowerHint
    ) external payable;
    function closeDen() external;
    function adjustDen(
        uint256 _maxFeePercentage,
        uint256 _collWithdrawal,
        uint256 _nectChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable;
}

interface IPoolContract {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getBalance(address user) external view returns (uint256);
    function harvest() external returns (uint256);
}

/**
 * @title BeraStrategyVault
 * @author Hackathon Team
 * @notice ERC4626 vault that manages leveraged positions on Beraborrow
 * @dev Implements risk-adjusted yield optimization with dual-strategy deployment
 */
contract BeraStrategyVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STRATEGY PARAMETERS
    //////////////////////////////////////////////////////////////*/

    // Risk-adjusted parameters from your analysis
    uint256 public constant TARGET_LTV = 75e16; // 75% - optimized from risk analysis
    uint256 public constant MAX_LTV = 85e16; // 85% - emergency threshold
    uint256 public constant MIN_LTV = 65e16; // 65% - rebalance threshold
    uint256 public constant REBALANCE_THRESHOLD = 5e16; // 5% deviation triggers rebalance

    // 🎯 PERFECT 40/60 ALLOCATION
    uint256 public constant LSP_ALLOCATION = 40e16; // 40% to LSP (stable base yield)
    uint256 public constant POOL_ALLOCATION = 60e16; // 60% to your target pool

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    // Beraborrow contracts
    address public borrowerOperations;
    address public denManager;
    address public nectToken;
    address public liquidStabilityPool;

    // Strategy contracts
    address public targetPool; // 0x9A3549ef882584a687C1FF1843e3B3C07a2A0cB2
    address public poolRouter;

    // Position tracking
    mapping(address => uint256) public userCollateral;
    mapping(address => uint256) public userDebt;
    uint256 public totalManagedDebt;
    uint256 public totalYieldEarned;
    uint256 public lastRebalanceTime;

    // Risk management
    uint256 public liquidationProbability = 35e16; // 35% based on your analysis
    bool public emergencyMode;

    // Strategy balances
    uint256 public lspBalance; // Tracks 40% LSP allocation
    uint256 public poolBalance; // Tracks 60% pool allocation

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event StrategyDeployed(
        address indexed user,
        uint256 collateral,
        uint256 debt,
        uint256 shares
    );
    event PositionRebalanced(uint256 newLTV, uint256 yieldHarvested);
    event EmergencyActivated(string reason);
    event YieldDistributed(
        uint256 lspAmount,
        uint256 poolAmount,
        uint256 timestamp
    );
    event LSPRewardsHarvested(uint256 pollenAmount, uint256 collateralAmount);
    event PoolRewardsHarvested(uint256 amount);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _initialOwner
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(_initialOwner) {
        lastRebalanceTime = block.timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    function initialize(
        address _borrowerOperations,
        address _denManager,
        address _nectToken,
        address _lsp,
        address _targetPool,
        address _poolRouter
    ) external onlyOwner {
        require(borrowerOperations == address(0), "Already initialized");

        borrowerOperations = _borrowerOperations;
        denManager = _denManager;
        nectToken = _nectToken;
        liquidStabilityPool = _lsp;
        targetPool = _targetPool;
        poolRouter = _poolRouter;

        emit StrategyDeployed(msg.sender, 0, 0, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        CORE VAULT LOGIC WITH VALIDATION
    //////////////////////////////////////////////////////////////*/

    function deposit(
        uint256 assets,
        address receiver
    ) public virtual override returns (uint256) {
        require(assets > 0, "Cannot deposit zero assets");
        require(receiver != address(0), "Invalid receiver");

        return super.deposit(assets, receiver);
    }

    function mint(
        uint256 shares,
        address receiver
    ) public virtual override returns (uint256) {
        require(shares > 0, "Cannot mint zero shares");
        require(receiver != address(0), "Invalid receiver");

        return super.mint(shares, receiver);
    }

    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override {
        super._deposit(caller, receiver, assets, shares);

        if (!emergencyMode) {
            _executeStrategy(caller, assets);
        }
    }

    function _executeStrategy(address user, uint256 collateralAmount) internal {
        // Step 1: Open or adjust CDP position
        uint256 nectBorrowed = _managePosition(user, collateralAmount);

        // Step 2: Deploy NECT across 40% LSP + 60% Pool
        if (nectBorrowed > 0) {
            _deployNECTToStrategies(nectBorrowed);
        }

        emit StrategyDeployed(
            user,
            collateralAmount,
            nectBorrowed,
            balanceOf(user)
        );
    }

    function _managePosition(
        address user,
        uint256 collateralAmount
    ) internal returns (uint256) {
        uint256 nectToBorrow = _calculateOptimalDebt(collateralAmount);

        // Track user position
        userCollateral[user] += collateralAmount;
        userDebt[user] += nectToBorrow;
        totalManagedDebt += nectToBorrow;

        // TODO: Integrate with actual Beraborrow contracts
        // IBorrowerOperations(borrowerOperations).openDen(maxFee, nectToBorrow, upperHint, lowerHint);

        return nectToBorrow;
    }

    /**
     * @notice 🎯 DEPLOY NECT: 40% LSP + 60% TARGET POOL
     */
    function _deployNECTToStrategies(uint256 nectAmount) internal {
        uint256 toLSP = (nectAmount * LSP_ALLOCATION) / 1e18; // 40%
        uint256 toPool = (nectAmount * POOL_ALLOCATION) / 1e18; // 60%

        if (toLSP > 0) {
            _deployToLSP(toLSP);
        }

        if (toPool > 0) {
            _deployToTargetPool(toPool);
        }

        emit YieldDistributed(toLSP, toPool, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                        🔥 ENHANCED STRATEGY IMPLEMENTATIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploy 40% to Liquid Stability Pool
     * @dev Enhanced with proper interface calls
     */
    function _deployToLSP(uint256 amount) internal {
        IERC20(nectToken).approve(liquidStabilityPool, amount);
        ILiquidStabilityPool(liquidStabilityPool).provideToSP(
            amount,
            address(0)
        );

        lspBalance += amount;
    }

    /**
     * @notice Deploy 60% to your target pool (0x9A3549ef882584a687C1FF1843e3B3C07a2A0cB2)
     * @dev Enhanced with pool interaction logic
     */
    function _deployToTargetPool(uint256 amount) internal {
        IERC20(nectToken).approve(targetPool, amount);

        // Try different pool interaction patterns
        try IPoolContract(targetPool).deposit(amount) {
            poolBalance += amount;
        } catch {
            // Fallback: direct transfer
            IERC20(nectToken).safeTransfer(targetPool, amount);
            poolBalance += amount;
        }
    }

    /*//////////////////////////////////////////////////////////////
                        🚀 YIELD HARVESTING & REWARDS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Harvest LSP rewards (POLLEN + liquidation collateral)
     */
    function harvestLSPRewards()
        external
        returns (uint256 pollenEarned, uint256 collateralEarned)
    {
        pollenEarned = ILiquidStabilityPool(liquidStabilityPool)
            .getDepositorPollenGain(address(this));
        collateralEarned = ILiquidStabilityPool(liquidStabilityPool)
            .getDepositorCollateralGain(address(this));

        if (pollenEarned > 0 || collateralEarned > 0) {
            // Claim without withdrawing NECT
            ILiquidStabilityPool(liquidStabilityPool).withdrawFromSP(0);

            totalYieldEarned += pollenEarned + collateralEarned;
            emit LSPRewardsHarvested(pollenEarned, collateralEarned);
        }
    }

    /**
     * @notice Harvest target pool rewards
     */
    function harvestPoolRewards() external returns (uint256 earned) {
        try IPoolContract(targetPool).harvest() returns (uint256 harvested) {
            earned = harvested;
            totalYieldEarned += earned;
            emit PoolRewardsHarvested(earned);
        } catch {
            // Pool doesn't support harvest, return 0
            earned = 0;
        }
    }

    /**
     * @notice Harvest ALL rewards (LSP + Pool)
     */
    function harvestAllRewards() external returns (uint256 totalHarvested) {
        (uint256 pollenEarned, uint256 collateralEarned) = this
            .harvestLSPRewards();
        uint256 poolEarned = this.harvestPoolRewards();

        totalHarvested = pollenEarned + collateralEarned + poolEarned;
    }

    /*//////////////////////////////////////////////////////////////
                        📊 POSITION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function rebalance() external {
        require(shouldRebalance(), "Rebalance not needed");

        uint256 currentLTV = _getCurrentLTV();
        uint256 yieldHarvested = this.harvestAllRewards();

        // Rebalance between LSP and pool if needed
        _rebalanceAllocations();

        lastRebalanceTime = block.timestamp;
        emit PositionRebalanced(currentLTV, yieldHarvested);
    }

    function _rebalanceAllocations() internal {
        uint256 totalNECT = lspBalance + poolBalance;
        uint256 targetLSP = (totalNECT * LSP_ALLOCATION) / 1e18;
        uint256 targetPoolAmount = (totalNECT * POOL_ALLOCATION) / 1e18;

        // Rebalance if allocations drift significantly
        if (lspBalance > targetLSP + ((targetLSP * 5) / 100)) {
            // Too much in LSP, move some to pool
            uint256 excess = lspBalance - targetLSP;
            _moveLSPToPool(excess);
        } else if (
            poolBalance > targetPoolAmount + ((targetPoolAmount * 5) / 100)
        ) {
            // Too much in pool, move some to LSP
            uint256 excess = poolBalance - targetPoolAmount;
            _movePoolToLSP(excess);
        }
    }

    function _moveLSPToPool(uint256 amount) internal {
        ILiquidStabilityPool(liquidStabilityPool).withdrawFromSP(amount);
        _deployToTargetPool(amount);
        lspBalance -= amount;
    }

    function _movePoolToLSP(uint256 amount) internal {
        try IPoolContract(targetPool).withdraw(amount) {
            _deployToLSP(amount);
            poolBalance -= amount;
        } catch {
            // Pool doesn't support withdrawal, skip rebalancing
        }
    }

    /*//////////////////////////////////////////////////////////////
                        🎯 VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getStrategyBalances()
        external
        view
        returns (uint256 lsp, uint256 pool, uint256 total)
    {
        lsp = lspBalance;
        pool = poolBalance;
        total = lsp + pool;
    }

    function getCurrentAllocation()
        external
        view
        returns (uint256 lspPercent, uint256 poolPercent)
    {
        uint256 total = lspBalance + poolBalance;
        if (total > 0) {
            lspPercent = (lspBalance * 1e18) / total;
            poolPercent = (poolBalance * 1e18) / total;
        }
    }

    function shouldRebalance() public view returns (bool) {
        if (block.timestamp < lastRebalanceTime + 1 hours) return false;
        uint256 currentLTV = _getCurrentLTV();
        return
            (currentLTV > TARGET_LTV + REBALANCE_THRESHOLD) ||
            (currentLTV < TARGET_LTV - REBALANCE_THRESHOLD);
    }

    /*//////////////////////////////////////////////////////////////
                        ⚠️ EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function emergencyExitAll() external onlyOwner {
        require(emergencyMode, "Not in emergency mode");

        // Exit LSP
        if (lspBalance > 0) {
            ILiquidStabilityPool(liquidStabilityPool).withdrawFromSP(
                lspBalance
            );
            lspBalance = 0;
        }

        // Exit pool
        if (poolBalance > 0) {
            try IPoolContract(targetPool).withdraw(poolBalance) {
                poolBalance = 0;
            } catch {
                // Pool exit failed, funds may be locked
            }
        }
    }

    function activateEmergencyMode(string calldata reason) external onlyOwner {
        emergencyMode = true;
        emit EmergencyActivated(reason);
    }

    /*//////////////////////////////////////////////////////////////
                        🔧 INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    function _calculateOptimalDebt(
        uint256 collateral
    ) internal view returns (uint256) {
        uint256 baseDebt = (collateral * TARGET_LTV) / 1e18;
        uint256 riskAdjustment = _calculateRiskAdjustment();
        return (baseDebt * riskAdjustment) / 1e18;
    }

    function _calculateRiskAdjustment() internal view returns (uint256) {
        return 95e16; // 95% of target (5% safety buffer)
    }

    function _getCurrentLTV() internal view returns (uint256) {
        return TARGET_LTV; // Placeholder - integrate with price feeds
    }

    function _harvestYield() internal returns (uint256) {
        return this.harvestAllRewards();
    }

    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalYieldEarned;
    }

    function getUserPosition(
        address user
    ) external view returns (uint256 collateral, uint256 debt, uint256 shares) {
        return (userCollateral[user], userDebt[user], balanceOf(user));
    }

    function getStrategyAllocation() external pure returns (uint256[2] memory) {
        return [LSP_ALLOCATION, POOL_ALLOCATION];
    }

    function updateTargetPool(address newPool) external onlyOwner {
        require(newPool != address(0), "Invalid pool address");
        targetPool = newPool;
    }

    // Helper function for POLLEN conversion (placeholder)
    function _swapPollenForAssets(uint256 pollenAmount) internal {
        // TODO: Implement POLLEN -> WBERA/NECT swap logic
        totalYieldEarned += pollenAmount;
    }
}
