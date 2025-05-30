// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BookingPool.sol";

contract BookingPoolFactoryV2 {
    // Events with all constructor parameters for easy verification
    event PoolCreated(
        address indexed pool,
        address indexed host,
        string bookingId,
        uint256 totalAmount,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 maxParticipants
    );

    event PoolCreatedWithDetails(
        address indexed pool,
        string bookingId,
        address host,
        uint256 totalAmount,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 maxParticipants,
        bytes constructorArgs
    );

    mapping(string => address) public bookingPools;
    address[] public allPools;

    function createBookingPool(
        string memory _bookingId,
        address _host,
        uint256 _totalAmount,
        uint256 _checkInDate,
        uint256 _checkOutDate,
        uint256 _maxParticipants
    ) external returns (address) {
        require(bookingPools[_bookingId] == address(0), "Pool already exists");
        require(_checkOutDate > _checkInDate, "Invalid dates");
        require(
            _checkInDate > block.timestamp,
            "Check-in date must be in future"
        );
        require(_totalAmount > 0, "Total amount must be greater than 0");
        require(
            _maxParticipants > 0,
            "Max participants must be greater than 0"
        );

        BookingPool newPool = new BookingPool(
            _bookingId,
            _host,
            _totalAmount,
            _checkInDate,
            _checkOutDate,
            _maxParticipants
        );

        address poolAddress = address(newPool);
        bookingPools[_bookingId] = poolAddress;
        allPools.push(poolAddress);

        // Encode constructor arguments for verification
        bytes memory constructorArgs = abi.encode(
            _bookingId,
            _host,
            _totalAmount,
            _checkInDate,
            _checkOutDate,
            _maxParticipants
        );

        emit PoolCreated(
            poolAddress,
            _host,
            _bookingId,
            _totalAmount,
            _checkInDate,
            _checkOutDate,
            _maxParticipants
        );

        emit PoolCreatedWithDetails(
            poolAddress,
            _bookingId,
            _host,
            _totalAmount,
            _checkInDate,
            _checkOutDate,
            _maxParticipants,
            constructorArgs
        );

        return poolAddress;
    }

    function getPoolsCount() external view returns (uint256) {
        return allPools.length;
    }

    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    function getPoolByBookingId(
        string memory _bookingId
    ) external view returns (address) {
        return bookingPools[_bookingId];
    }
}
