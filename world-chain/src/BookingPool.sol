// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BookingPool {
    // Enums
    enum PoolStatus {
        Active,
        Confirmed,
        CheckedIn,
        CheckedOut,
        Cancelled,
        Refunded
    }

    // Pool information
    string public bookingId;
    address public host;
    uint256 public totalAmount;
    uint256 public checkInDate;
    uint256 public checkOutDate;
    uint256 public maxParticipants;
    uint256 public platformFeePercentage;
    address public platformOwner;

    // Pool state
    mapping(address => uint256) public contributions;
    address[] public participants;
    uint256 public totalContributed;
    bool public fundsReleased;
    bool public poolCanceled;
    PoolStatus public currentStatus;

    // Events
    event ParticipantJoined(address indexed participant, uint256 amount);
    event FundsReleased(address indexed host, uint256 amount);
    event RefundIssued(address indexed participant, uint256 amount);
    event PoolCanceled();
    event PoolConfirmed(address indexed host);
    event PoolCheckedIn(address indexed host);
    event PoolCheckedOut(address indexed host);
    event PaymentReleased(address indexed host, uint256 amount);

    // Modifiers
    modifier onlyAfterCheckout() {
        require(block.timestamp > checkOutDate, "Checkout date not reached");
        _;
    }

    modifier poolNotFull() {
        require(participants.length < maxParticipants, "Pool is full");
        _;
    }

    modifier onlyBeforeCheckin() {
        require(block.timestamp < checkInDate, "Check-in date passed");
        _;
    }

    modifier onlyHost() {
        require(msg.sender == host, "Only host can call this function");
        _;
    }

    modifier poolActive() {
        require(currentStatus == PoolStatus.Active, "Pool is not active");
        _;
    }

    modifier poolConfirmed() {
        require(currentStatus == PoolStatus.Confirmed, "Pool is not confirmed");
        _;
    }

    modifier poolCheckedIn() {
        require(
            currentStatus == PoolStatus.CheckedIn,
            "Pool is not checked in"
        );
        _;
    }

    constructor(
        string memory _bookingId,
        address _host,
        uint256 _totalAmount,
        uint256 _checkInDate,
        uint256 _checkOutDate,
        uint256 _maxParticipants,
        uint256 _platformFeePercentage,
        address _platformOwner
    ) {
        bookingId = _bookingId;
        host = _host;
        totalAmount = _totalAmount;
        checkInDate = _checkInDate;
        checkOutDate = _checkOutDate;
        maxParticipants = _maxParticipants;
        platformFeePercentage = _platformFeePercentage;
        platformOwner = _platformOwner;
        currentStatus = PoolStatus.Active;
    }

    function joinPool()
        external
        payable
        onlyBeforeCheckin
        poolNotFull
        poolActive
    {
        require(contributions[msg.sender] == 0, "Already joined pool");
        require(msg.value > 0, "Must contribute ETH");

        // Calculate fair share per person
        uint256 sharePerPerson = totalAmount / maxParticipants;
        require(
            msg.value >= sharePerPerson,
            "Insufficient contribution amount"
        );

        contributions[msg.sender] = msg.value;
        participants.push(msg.sender);
        totalContributed += msg.value;

        // Refund excess payment
        if (msg.value > sharePerPerson) {
            uint256 excess = msg.value - sharePerPerson;
            contributions[msg.sender] = sharePerPerson;
            totalContributed -= excess;
            payable(msg.sender).transfer(excess);
        }

        emit ParticipantJoined(msg.sender, contributions[msg.sender]);
    }

    function confirmPool() external onlyHost poolActive {
        require(
            totalContributed >= totalAmount,
            "Insufficient funds collected"
        );

        currentStatus = PoolStatus.Confirmed;
        emit PoolConfirmed(msg.sender);
    }

    function checkIn() external onlyHost poolConfirmed {
        require(block.timestamp >= checkInDate, "Check-in date not reached");
        require(block.timestamp < checkOutDate, "Check-in period expired");

        currentStatus = PoolStatus.CheckedIn;
        emit PoolCheckedIn(msg.sender);
    }

    function checkOut() external onlyHost poolCheckedIn {
        currentStatus = PoolStatus.CheckedOut;

        // Release payment to host with platform fee
        uint256 platformFee = (totalContributed * platformFeePercentage) / 100;
        uint256 hostAmount = totalContributed - platformFee;

        fundsReleased = true;

        // Transfer to host
        (bool hostSuccess, ) = host.call{value: hostAmount}("");
        require(hostSuccess, "Host transfer failed");

        // Transfer platform fee
        if (platformFee > 0) {
            (bool platformSuccess, ) = platformOwner.call{value: platformFee}(
                ""
            );
            require(platformSuccess, "Platform fee transfer failed");
        }

        emit PoolCheckedOut(msg.sender);
        emit PaymentReleased(msg.sender, hostAmount);
        emit FundsReleased(msg.sender, totalContributed);
    }

    function releaseFunds() external onlyAfterCheckout {
        require(
            currentStatus == PoolStatus.Confirmed ||
                currentStatus == PoolStatus.CheckedIn,
            "Invalid status for release"
        );
        require(!fundsReleased, "Funds already released");
        require(
            totalContributed >= totalAmount,
            "Insufficient funds collected"
        );

        // Auto check-out if not done manually
        if (currentStatus != PoolStatus.CheckedOut) {
            currentStatus = PoolStatus.CheckedOut;
        }

        uint256 platformFee = (totalContributed * platformFeePercentage) / 100;
        uint256 hostAmount = totalContributed - platformFee;

        fundsReleased = true;

        // Transfer to host
        (bool hostSuccess, ) = host.call{value: hostAmount}("");
        require(hostSuccess, "Host transfer failed");

        // Transfer platform fee
        if (platformFee > 0) {
            (bool platformSuccess, ) = platformOwner.call{value: platformFee}(
                ""
            );
            require(platformSuccess, "Platform fee transfer failed");
        }

        emit PaymentReleased(msg.sender, hostAmount);
        emit FundsReleased(host, totalContributed);
    }

    function cancelPool() external onlyHost onlyBeforeCheckin {
        require(
            currentStatus == PoolStatus.Active ||
                currentStatus == PoolStatus.Confirmed,
            "Cannot cancel pool"
        );

        currentStatus = PoolStatus.Cancelled;
        poolCanceled = true;

        // Refund all participants
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 refundAmount = contributions[participant];

            if (refundAmount > 0) {
                contributions[participant] = 0;
                (bool success, ) = participant.call{value: refundAmount}("");
                require(success, "Refund failed");

                emit RefundIssued(participant, refundAmount);
            }
        }

        emit PoolCanceled();
    }

    function refund() external {
        require(
            currentStatus == PoolStatus.Active ||
                currentStatus == PoolStatus.Confirmed,
            "Cannot refund in current status"
        );
        require(contributions[msg.sender] > 0, "No contribution to refund");

        uint256 refundAmount;

        if (
            currentStatus == PoolStatus.Active && totalContributed < totalAmount
        ) {
            // Failed pool - full refund
            refundAmount = contributions[msg.sender];
        } else {
            // Calculate refund based on timing
            refundAmount = calculateRefundAmount(msg.sender);
        }

        require(refundAmount > 0, "No refund available");

        contributions[msg.sender] = 0;
        totalContributed -= refundAmount;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit RefundIssued(msg.sender, refundAmount);
    }

    // View functions
    function getParticipantsCount() external view returns (uint256) {
        return participants.length;
    }

    function getAllParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getSharePerPerson() external view returns (uint256) {
        return totalAmount / maxParticipants;
    }

    function getPoolStatus()
        external
        view
        returns (
            bool isActive,
            bool isFull,
            bool canJoin,
            bool canRelease,
            uint256 remainingSlots,
            PoolStatus status
        )
    {
        isActive = currentStatus == PoolStatus.Active;
        isFull = participants.length >= maxParticipants;
        canJoin = isActive && !isFull && block.timestamp < checkInDate;
        canRelease =
            (currentStatus == PoolStatus.Confirmed ||
                currentStatus == PoolStatus.CheckedIn) &&
            block.timestamp > checkOutDate &&
            totalContributed >= totalAmount;
        remainingSlots = maxParticipants > participants.length
            ? maxParticipants - participants.length
            : 0;
        status = currentStatus;
    }

    function getPoolInfo()
        external
        view
        returns (
            string memory _bookingId,
            address _host,
            uint256 _totalAmount,
            uint256 _checkInDate,
            uint256 _checkOutDate,
            uint256 _maxParticipants,
            uint256 _participantsCount,
            uint256 _totalContributed,
            bool _fundsReleased,
            bool _poolCanceled,
            PoolStatus _status
        )
    {
        return (
            bookingId,
            host,
            totalAmount,
            checkInDate,
            checkOutDate,
            maxParticipants,
            participants.length,
            totalContributed,
            fundsReleased,
            poolCanceled,
            currentStatus
        );
    }

    // Helper Functions
    function calculateRefundAmount(
        address participant
    ) internal view returns (uint256) {
        uint256 contribution = contributions[participant];
        uint256 timeUntilCheckIn = checkInDate > block.timestamp
            ? checkInDate - block.timestamp
            : 0;

        // Refund policies:
        // More than 7 days: 90% refund
        // 3-7 days: 50% refund
        // 1-3 days: 25% refund
        // Less than 1 day: No refund

        if (timeUntilCheckIn > 7 days) {
            return (contribution * 90) / 100;
        } else if (timeUntilCheckIn > 3 days) {
            return (contribution * 50) / 100;
        } else if (timeUntilCheckIn > 1 days) {
            return (contribution * 25) / 100;
        } else {
            return 0;
        }
    }
}
