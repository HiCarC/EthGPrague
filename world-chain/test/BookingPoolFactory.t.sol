// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/BookingPoolFactory.sol";
import "../src/BookingPool.sol";

contract BookingPoolFactoryV2Test is Test {
    BookingPoolFactoryV2 factory;

    address host = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);
    address user3 = address(0x4);
    address platformOwner;

    function setUp() public {
        factory = new BookingPoolFactoryV2();
        platformOwner = factory.platformOwner();

        // Fund test accounts
        vm.deal(host, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
        vm.deal(platformOwner, 1 ether);
    }

    function testCreateProperty() public {
        string[] memory imageUrls = new string[](2);
        imageUrls[0] = "https://example.com/image1.jpg";
        imageUrls[1] = "https://example.com/image2.jpg";

        vm.prank(host);
        uint256 propertyId = factory.createProperty(
            "Test Hotel",
            "A beautiful test hotel",
            "Test City",
            imageUrls,
            0.1 ether, // 0.1 ETH per night
            4
        );

        assertEq(propertyId, 1);

        BookingPoolFactoryV2.Property memory property = factory.getProperty(
            propertyId
        );
        assertEq(property.owner, host);
        assertEq(property.name, "Test Hotel");
        assertEq(property.pricePerNight, 0.1 ether);
        assertTrue(property.isActive);
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

    function testCreatePoolForProperty() public {
        // First create a property
        string[] memory imageUrls = new string[](1);
        imageUrls[0] = "https://example.com/image.jpg";

        vm.prank(host);
        uint256 propertyId = factory.createProperty(
            "Test Hotel",
            "A test hotel",
            "Test City",
            imageUrls,
            0.1 ether,
            4
        );

        uint256 checkInDate = block.timestamp + 1 days;
        uint256 checkOutDate = checkInDate + 3 days; // 3 nights
        uint256 nights = 3;

        vm.prank(user1);
        address poolAddress = factory.createBookingPoolForProperty(
            propertyId,
            "property_booking_1",
            checkInDate,
            checkOutDate,
            4,
            nights
        );

        assertNotEq(poolAddress, address(0));
        assertEq(factory.bookingPools("property_booking_1"), poolAddress);
    }

    function testJoinPoolWithNewFeatures() public {
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

        // Check status
        (bool isActive, , , , , BookingPool.PoolStatus status) = pool
            .getPoolStatus();
        assertTrue(isActive);
        assertEq(uint(status), uint(BookingPool.PoolStatus.Active));
    }

    function testPoolLifecycle() public {
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

        // Fill the pool
        vm.prank(user1);
        pool.joinPool{value: sharePerPerson}();
        vm.prank(user2);
        pool.joinPool{value: sharePerPerson}();
        vm.prank(user3);
        pool.joinPool{value: sharePerPerson}();
        vm.prank(host);
        pool.joinPool{value: sharePerPerson}();

        // Host confirms pool
        vm.prank(host);
        pool.confirmPool();

        // Fast forward to check-in time
        vm.warp(checkInDate);

        // Host checks in
        vm.prank(host);
        pool.checkIn();

        // Fast forward past checkout
        vm.warp(checkOutDate + 1);

        // Host checks out and releases funds
        uint256 hostBalanceBefore = host.balance;
        uint256 platformBalanceBefore = platformOwner.balance;

        vm.prank(host);
        pool.checkOut();

        // Check that funds were distributed with platform fee
        assertGt(host.balance, hostBalanceBefore);
        assertGt(platformOwner.balance, platformBalanceBefore);
        assertTrue(pool.fundsReleased());
    }

    function testRefundLogic() public {
        uint256 checkInDate = block.timestamp + 8 days; // 8 days from now
        uint256 checkOutDate = checkInDate + 2 days;

        vm.prank(host);
        address poolAddress = factory.createBookingPool(
            "booking_refund",
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

        uint256 userBalanceBefore = user1.balance;

        // Request refund (more than 7 days before checkin = 90% refund)
        vm.prank(user1);
        pool.refund();

        uint256 expectedRefund = (sharePerPerson * 90) / 100;
        assertEq(user1.balance, userBalanceBefore + expectedRefund);
    }

    function testPlatformFeeUpdate() public {
        vm.prank(platformOwner);
        factory.setPlatformFee(10); // Set to 10%

        assertEq(factory.platformFeePercentage(), 10);
    }

    function testGetAllActiveProperties() public {
        string[] memory imageUrls = new string[](1);
        imageUrls[0] = "https://example.com/image.jpg";

        // Create multiple properties
        vm.startPrank(host);
        factory.createProperty(
            "Hotel 1",
            "Description 1",
            "City 1",
            imageUrls,
            0.1 ether,
            4
        );
        factory.createProperty(
            "Hotel 2",
            "Description 2",
            "City 2",
            imageUrls,
            0.2 ether,
            6
        );
        factory.createProperty(
            "Hotel 3",
            "Description 3",
            "City 3",
            imageUrls,
            0.3 ether,
            8
        );
        vm.stopPrank();

        BookingPoolFactoryV2.Property[] memory activeProperties = factory
            .getAllActiveProperties();
        assertEq(activeProperties.length, 3);
        assertEq(activeProperties[0].name, "Hotel 1");
        assertEq(activeProperties[1].name, "Hotel 2");
        assertEq(activeProperties[2].name, "Hotel 3");
    }
}
