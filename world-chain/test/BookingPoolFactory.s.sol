// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/BookingPoolFactory.sol";
import "../src/BookingPool.sol";

contract BookingPoolFactoryTest is Test {
    BookingPoolFactory factory;

    address host = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);
    address user3 = address(0x4);

    function setUp() public {
        factory = new BookingPoolFactory();

        // Fund test accounts
        vm.deal(host, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
    }

    function testCreatePool() public {
        uint256 checkInDate = block.timestamp + 1 days;
        uint256 checkOutDate = checkInDate + 2 days;

        vm.prank(host);
        address poolAddress = factory.createBookingPool(
            "booking_123",
            host,
            1 ether,
            checkInDate,
            checkOutDate,
            4
        );

        assertEq(factory.bookingPools("booking_123"), poolAddress);
        assertEq(factory.getPoolsCount(), 1);
    }

    function testJoinPool() public {
        uint256 checkInDate = block.timestamp + 1 days;
        uint256 checkOutDate = checkInDate + 2 days;

        vm.prank(host);
        address poolAddress = factory.createBookingPool(
            "booking_123",
            host,
            1 ether,
            checkInDate,
            checkOutDate,
            4
        );

        BookingPool pool = BookingPool(poolAddress);
        uint256 sharePerPerson = pool.getSharePerPerson();

        // User joins pool
        vm.prank(user1);
        pool.joinPool{value: sharePerPerson}();

        assertEq(pool.getParticipantsCount(), 1);
        assertEq(pool.contributions(user1), sharePerPerson);
    }

    function testReleaseFunds() public {
        uint256 checkInDate = block.timestamp + 1 days;
        uint256 checkOutDate = checkInDate + 2 days;

        vm.prank(host);
        address poolAddress = factory.createBookingPool(
            "booking_123",
            host,
            1 ether,
            checkInDate,
            checkOutDate,
            4
        );

        BookingPool pool = BookingPool(poolAddress);
        uint256 sharePerPerson = pool.getSharePerPerson();

        // Users join pool
        vm.prank(user1);
        pool.joinPool{value: sharePerPerson}();

        vm.prank(user2);
        pool.joinPool{value: sharePerPerson}();

        vm.prank(user3);
        pool.joinPool{value: sharePerPerson}();

        vm.prank(host);
        pool.joinPool{value: sharePerPerson}();

        // Fast forward past checkout date
        vm.warp(checkOutDate + 1);

        uint256 hostBalanceBefore = host.balance;

        // Release funds
        pool.releaseFunds();

        assertEq(pool.fundsReleased(), true);
        assertGt(host.balance, hostBalanceBefore);
    }

    function testFailJoinAfterCheckin() public {
        uint256 checkInDate = block.timestamp + 1 days;
        uint256 checkOutDate = checkInDate + 2 days;

        vm.prank(host);
        address poolAddress = factory.createBookingPool(
            "booking_123",
            host,
            1 ether,
            checkInDate,
            checkOutDate,
            4
        );

        BookingPool pool = BookingPool(poolAddress);

        // Fast forward past check-in date
        vm.warp(checkInDate + 1);

        // This should fail
        vm.prank(user1);
        pool.joinPool{value: 0.25 ether}();
    }
}
