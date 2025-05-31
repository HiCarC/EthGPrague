// world-chain/src/MockYieldStrategy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockYieldStrategy {
    // 🎯 SIMPLE MOCK: Users get 10% of their deposit as yield
    uint256 public constant YIELD_PERCENTAGE = 10; // 10% yield

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTime;
    mapping(address => uint256) public poolContributions; // Track pool contributions
    address public platformOwner;

    event Deposited(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);

    constructor(address _platformOwner) {
        platformOwner = _platformOwner;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must deposit some ETH");
        deposits[msg.sender] += msg.value;
        depositTime[msg.sender] = block.timestamp;
        emit Deposited(msg.sender, msg.value);
    }

    // 🎯 SIMPLE: Calculate 10% yield based on deposit amount
    function calculateYieldEarned(
        address user
    ) public view returns (uint256 userYield, uint256 platformYield) {
        uint256 userAmount = poolContributions[user]; // Use pool contribution instead of direct deposit
        if (userAmount == 0) return (0, 0);

        // Simple: 10% of contribution amount as yield
        uint256 totalYield = (userAmount * YIELD_PERCENTAGE) / 100;

        // Platform gets 20% of yield
        platformYield = (totalYield * 20) / 100;
        userYield = totalYield - platformYield;
    }

    // Simple yield for time-based estimation
    function estimateYield(
        uint256 amount,
        uint256 timeInSeconds
    )
        external
        pure
        returns (uint256 totalYield, uint256 userYield, uint256 platformYield)
    {
        // Simple: 10% yield regardless of time (for demo)
        totalYield = (amount * YIELD_PERCENTAGE) / 100;
        platformYield = (totalYield * 20) / 100;
        userYield = totalYield - platformYield;
    }

    // Allow anyone to fund (for demo)
    function fundYieldPool() external payable {
        // Anyone can fund the pool for demo purposes
    }

    function getDepositInfo(
        address user
    )
        external
        view
        returns (
            uint256 depositAmount,
            uint256 timeDeposited,
            uint256 pendingUserYield,
            uint256 pendingPlatformYield,
            uint256 totalClaimed
        )
    {
        (uint256 userYield, uint256 platformYield) = calculateYieldEarned(user);
        return (
            deposits[user],
            depositTime[user],
            userYield,
            platformYield,
            0 // No tracking of claimed for simplicity
        );
    }

    // Add function for pool to register user contributions
    function registerContribution(address user, uint256 amount) external {
        poolContributions[user] += amount;
    }
}
