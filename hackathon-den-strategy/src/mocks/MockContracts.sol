// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

// Mock BorrowerOperations for testing
contract MockBorrowerOperations {
    mapping(address => uint256) public userCollateral;
    mapping(address => uint256) public userDebt;

    function openDen(
        uint256 maxFeePercentage,
        uint256 collateralAmount,
        uint256 nectAmount,
        address upperHint,
        address lowerHint
    ) external {
        userCollateral[msg.sender] += collateralAmount;
        userDebt[msg.sender] += nectAmount;
    }

    function adjustDen(
        uint256 maxFeePercentage,
        uint256 collateralWithdrawal,
        uint256 nectChange,
        bool isDebtIncrease,
        address upperHint,
        address lowerHint
    ) external {
        if (isDebtIncrease) {
            userDebt[msg.sender] += nectChange;
        } else {
            userDebt[msg.sender] -= nectChange;
        }
    }

    function closeDen() external {
        userCollateral[msg.sender] = 0;
        userDebt[msg.sender] = 0;
    }
}

// Mock DenManager for testing
contract MockDenManager {
    function getDenStatus(address borrower) external pure returns (uint256) {
        return 1; // Active
    }

    function getDenCollateral(
        address borrower
    ) external pure returns (uint256) {
        return 100e18; // Mock collateral
    }

    function getDenDebt(address borrower) external pure returns (uint256) {
        return 75e18; // Mock debt
    }
}

// Mock Liquid Stability Pool for testing
contract MockLSP {
    IERC20 public asset;
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    function deposit(uint256 amount, address depositor) external {
        // Simple mock deposit - just track the amount
        balances[depositor] += amount;
        totalDeposits += amount;
    }

    function withdraw(uint256 amount, address withdrawer) external {
        require(balances[withdrawer] >= amount, "Insufficient balance");
        balances[withdrawer] -= amount;
        totalDeposits -= amount;
    }

    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }
}

// Mock Target Pool for testing
contract MockTargetPool {
    mapping(address => uint256) public deposits;
    uint256 public totalLiquidity;

    function addLiquidity(uint256 amount, address provider) external {
        deposits[provider] += amount;
        totalLiquidity += amount;
    }

    function removeLiquidity(uint256 amount, address provider) external {
        require(deposits[provider] >= amount, "Insufficient liquidity");
        deposits[provider] -= amount;
        totalLiquidity -= amount;
    }

    function getProviderLiquidity(
        address provider
    ) external view returns (uint256) {
        return deposits[provider];
    }
}
