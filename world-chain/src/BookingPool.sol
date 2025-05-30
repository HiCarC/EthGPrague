// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BookingPool {
    // Pool information
    string public bookingId;
    address public host;
    uint256 public totalAmount;
    uint256 public checkInDate;
    uint256 public checkOutDate;
    uint256 public maxParticipants;

    // Pool state
    mapping(address => uint256) public contributions;
    address[] public participants;
    uint256 public totalContributed;
    bool public fundsReleased;
    bool public poolCanceled;

    // Events
    event ParticipantJoined(address indexed participant, uint256 amount);
    event FundsReleased(address indexed host, uint256 amount);
    event RefundIssued(address indexed participant, uint256 amount);
    event PoolCanceled();

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
        require(!poolCanceled, "Pool has been canceled");
        require(!fundsReleased, "Funds already released");
        _;
    }

    constructor(
        string memory _bookingId,
        address _host,
        uint256 _totalAmount,
        uint256 _checkInDate,
        uint256 _checkOutDate,
        uint256 _maxParticipants
    ) {
        bookingId = _bookingId;
        host = _host;
        totalAmount = _totalAmount;
        checkInDate = _checkInDate;
        checkOutDate = _checkOutDate;
        maxParticipants = _maxParticipants;
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

        emit ParticipantJoined(msg.sender, msg.value);
    }

    function releaseFunds() external onlyAfterCheckout poolActive {
        require(
            totalContributed >= totalAmount,
            "Insufficient funds collected"
        );

        fundsReleased = true;
        uint256 balance = address(this).balance;

        // Transfer funds to host
        (bool success, ) = host.call{value: balance}("");
        require(success, "Transfer failed");

        emit FundsReleased(host, balance);
    }

    function cancelPool() external onlyHost onlyBeforeCheckin {
        require(!poolCanceled, "Pool already canceled");

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

    function refund() external poolActive {
        require(
            block.timestamp > checkInDate,
            "Cannot refund before check-in date"
        );
        require(
            totalContributed < totalAmount,
            "Pool was successful, no refunds"
        );
        require(contributions[msg.sender] > 0, "No contribution to refund");

        uint256 refundAmount = contributions[msg.sender];
        contributions[msg.sender] = 0;

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
            uint256 remainingSlots
        )
    {
        isActive = !poolCanceled && !fundsReleased;
        isFull = participants.length >= maxParticipants;
        canJoin = isActive && !isFull && block.timestamp < checkInDate;
        canRelease =
            isActive &&
            block.timestamp > checkOutDate &&
            totalContributed >= totalAmount;
        remainingSlots = maxParticipants > participants.length
            ? maxParticipants - participants.length
            : 0;
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
            bool _poolCanceled
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
            poolCanceled
        );
    }
}
