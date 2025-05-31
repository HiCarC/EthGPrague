// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Interface for ERC20 token (WLD)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
}

contract HotelBookingUpgradeable is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    // WLD Token contract address on World Chain Mainnet
    IERC20 public constant WLD_TOKEN =
        IERC20(0x2cFc85d8E48F8EAB294be644d9E25C3030863003);

    // Structs
    struct Property {
        uint256 id;
        address owner;
        string name;
        string description;
        string location;
        string[] imageUrls;
        uint256 pricePerNight; // in WLD wei (18 decimals)
        uint256 maxGuests;
        bool isActive;
        uint256 createdAt;
    }

    struct Booking {
        uint256 id;
        uint256 propertyId;
        address guest;
        uint256 checkInDate;
        uint256 checkOutDate;
        uint256 totalAmount; // in WLD wei
        uint256 guestCount;
        BookingStatus status;
        uint256 createdAt;
    }

    enum BookingStatus {
        Pending,
        Confirmed,
        CheckedIn,
        CheckedOut,
        Cancelled,
        Refunded
    }

    // State variables
    mapping(uint256 => Property) public properties;
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public ownerProperties;
    mapping(address => uint256[]) public guestBookings;
    mapping(uint256 => uint256[]) public propertyBookings;

    uint256 public nextPropertyId;
    uint256 public nextBookingId;
    uint256 public platformFeePercentage;
    address public platformOwner;

    // Events
    event PropertyCreated(
        uint256 indexed propertyId,
        address indexed owner,
        string name
    );
    event PropertyUpdated(uint256 indexed propertyId, address indexed owner);
    event PropertyDeactivated(
        uint256 indexed propertyId,
        address indexed owner
    );
    event BookingCreated(
        uint256 indexed bookingId,
        uint256 indexed propertyId,
        address indexed guest
    );
    event BookingConfirmed(
        uint256 indexed bookingId,
        address indexed propertyOwner
    );
    event BookingCancelled(uint256 indexed bookingId, address indexed guest);
    event BookingCheckedIn(
        uint256 indexed bookingId,
        address indexed propertyOwner
    );
    event BookingCheckedOut(
        uint256 indexed bookingId,
        address indexed propertyOwner
    );
    event PaymentReleased(
        uint256 indexed bookingId,
        address indexed propertyOwner,
        uint256 amount
    );
    event RefundIssued(
        uint256 indexed bookingId,
        address indexed guest,
        uint256 amount
    );

    // Modifiers
    modifier onlyPropertyOwner(uint256 propertyId) {
        require(
            properties[propertyId].owner == msg.sender,
            "Not property owner"
        );
        _;
    }

    modifier onlyBookingGuest(uint256 bookingId) {
        require(bookings[bookingId].guest == msg.sender, "Not booking guest");
        _;
    }

    modifier propertyExists(uint256 propertyId) {
        require(
            propertyId > 0 && propertyId < nextPropertyId,
            "Property does not exist"
        );
        _;
    }

    modifier bookingExists(uint256 bookingId) {
        require(
            bookingId > 0 && bookingId < nextBookingId,
            "Booking does not exist"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        nextPropertyId = 1;
        nextBookingId = 1;
        platformFeePercentage = 5; // 5% platform fee
        platformOwner = msg.sender;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // Property Management Functions
    function createProperty(
        string memory name,
        string memory description,
        string memory location,
        string[] memory imageUrls,
        uint256 pricePerNight,
        uint256 maxGuests
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(pricePerNight > 0, "Price must be greater than 0");
        require(maxGuests > 0, "Max guests must be greater than 0");

        uint256 propertyId = nextPropertyId;
        nextPropertyId++;

        properties[propertyId] = Property({
            id: propertyId,
            owner: msg.sender,
            name: name,
            description: description,
            location: location,
            imageUrls: imageUrls,
            pricePerNight: pricePerNight,
            maxGuests: maxGuests,
            isActive: true,
            createdAt: block.timestamp
        });

        ownerProperties[msg.sender].push(propertyId);

        emit PropertyCreated(propertyId, msg.sender, name);
        return propertyId;
    }

    function updateProperty(
        uint256 propertyId,
        string memory name,
        string memory description,
        string memory location,
        string[] memory imageUrls,
        uint256 pricePerNight,
        uint256 maxGuests
    ) external onlyPropertyOwner(propertyId) propertyExists(propertyId) {
        Property storage property = properties[propertyId];

        property.name = name;
        property.description = description;
        property.location = location;
        property.imageUrls = imageUrls;
        property.pricePerNight = pricePerNight;
        property.maxGuests = maxGuests;

        emit PropertyUpdated(propertyId, msg.sender);
    }

    function deactivateProperty(
        uint256 propertyId
    ) external onlyPropertyOwner(propertyId) propertyExists(propertyId) {
        properties[propertyId].isActive = false;
        emit PropertyDeactivated(propertyId, msg.sender);
    }

    function activateProperty(
        uint256 propertyId
    ) external onlyPropertyOwner(propertyId) propertyExists(propertyId) {
        properties[propertyId].isActive = true;
    }

    // Booking Functions
    function createBooking(
        uint256 propertyId,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 guestCount,
        uint256 totalAmount
    ) external propertyExists(propertyId) returns (uint256) {
        Property memory property = properties[propertyId];

        uint256 bookingId = nextBookingId;
        nextBookingId++;

        bookings[bookingId] = Booking({
            id: bookingId,
            propertyId: propertyId,
            guest: msg.sender,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            totalAmount: totalAmount,
            guestCount: guestCount,
            status: BookingStatus.Pending,
            createdAt: block.timestamp
        });

        guestBookings[msg.sender].push(bookingId);
        propertyBookings[propertyId].push(bookingId);

        emit BookingCreated(bookingId, propertyId, msg.sender);
        return bookingId;
    }

    function confirmBooking(
        uint256 bookingId
    ) external bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(
            properties[booking.propertyId].owner == msg.sender,
            "Not property owner"
        );
        require(
            booking.status == BookingStatus.Pending,
            "Booking is not pending"
        );

        booking.status = BookingStatus.Confirmed;
        emit BookingConfirmed(bookingId, msg.sender);
    }

    function cancelBooking(
        uint256 bookingId
    ) external bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(
            booking.guest == msg.sender ||
                properties[booking.propertyId].owner == msg.sender,
            "Not authorized"
        );
        require(
            booking.status == BookingStatus.Pending ||
                booking.status == BookingStatus.Confirmed,
            "Cannot cancel booking"
        );

        booking.status = BookingStatus.Cancelled;

        // Refund logic - different percentages based on timing
        uint256 refundAmount = calculateRefundAmount(bookingId);
        if (refundAmount > 0) {
            booking.status = BookingStatus.Refunded;
            WLD_TOKEN.transfer(booking.guest, refundAmount);
            emit RefundIssued(bookingId, booking.guest, refundAmount);
        }

        emit BookingCancelled(bookingId, booking.guest);
    }

    function checkIn(uint256 bookingId) external bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(
            properties[booking.propertyId].owner == msg.sender,
            "Not property owner"
        );
        require(
            booking.status == BookingStatus.Confirmed,
            "Booking is not confirmed"
        );
        require(
            block.timestamp >= booking.checkInDate,
            "Check-in date not reached"
        );
        require(
            block.timestamp < booking.checkOutDate,
            "Check-in period expired"
        );

        booking.status = BookingStatus.CheckedIn;
        emit BookingCheckedIn(bookingId, msg.sender);
    }

    function checkOut(uint256 bookingId) external bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(
            properties[booking.propertyId].owner == msg.sender,
            "Not property owner"
        );
        require(
            booking.status == BookingStatus.CheckedIn,
            "Guest has not checked in"
        );

        booking.status = BookingStatus.CheckedOut;

        // Release payment to property owner
        uint256 platformFee = (booking.totalAmount * platformFeePercentage) /
            100;
        uint256 ownerAmount = booking.totalAmount - platformFee;

        WLD_TOKEN.transfer(properties[booking.propertyId].owner, ownerAmount);
        WLD_TOKEN.transfer(platformOwner, platformFee);

        emit BookingCheckedOut(bookingId, msg.sender);
        emit PaymentReleased(bookingId, msg.sender, ownerAmount);
    }

    // View Functions
    function getProperty(
        uint256 propertyId
    ) external view propertyExists(propertyId) returns (Property memory) {
        return properties[propertyId];
    }

    function getBooking(
        uint256 bookingId
    ) external view bookingExists(bookingId) returns (Booking memory) {
        return bookings[bookingId];
    }

    function getOwnerProperties(
        address owner
    ) external view returns (uint256[] memory) {
        return ownerProperties[owner];
    }

    function getGuestBookings(
        address guest
    ) external view returns (uint256[] memory) {
        return guestBookings[guest];
    }

    function getPropertyBookings(
        uint256 propertyId
    ) external view returns (uint256[] memory) {
        return propertyBookings[propertyId];
    }

    function getAllActiveProperties()
        external
        view
        returns (Property[] memory)
    {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextPropertyId; i++) {
            if (properties[i].isActive) {
                activeCount++;
            }
        }

        Property[] memory activeProperties = new Property[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < nextPropertyId; i++) {
            if (properties[i].isActive) {
                activeProperties[index] = properties[i];
                index++;
            }
        }

        return activeProperties;
    }

    // Helper Functions
    function isPropertyBooked(
        uint256 propertyId,
        uint256 checkInDate,
        uint256 checkOutDate
    ) public view returns (bool) {
        uint256[] memory bookingIds = propertyBookings[propertyId];

        for (uint256 i = 0; i < bookingIds.length; i++) {
            Booking memory booking = bookings[bookingIds[i]];
            if (
                booking.status == BookingStatus.Confirmed ||
                booking.status == BookingStatus.CheckedIn
            ) {
                if (
                    !(checkOutDate <= booking.checkInDate ||
                        checkInDate >= booking.checkOutDate)
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    function calculateRefundAmount(
        uint256 bookingId
    ) internal view returns (uint256) {
        Booking memory booking = bookings[bookingId];
        uint256 timeUntilCheckIn = booking.checkInDate - block.timestamp;

        // Refund policies:
        // More than 7 days: 90% refund
        // 3-7 days: 50% refund
        // 1-3 days: 25% refund
        // Less than 1 day: No refund

        if (timeUntilCheckIn > 7 days) {
            return (booking.totalAmount * 90) / 100;
        } else if (timeUntilCheckIn > 3 days) {
            return (booking.totalAmount * 50) / 100;
        } else if (timeUntilCheckIn > 1 days) {
            return (booking.totalAmount * 25) / 100;
        } else {
            return 0;
        }
    }

    // Admin Functions
    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 20, "Fee cannot exceed 20%");
        platformFeePercentage = newFeePercentage;
    }

    function setPlatformOwner(address newPlatformOwner) external onlyOwner {
        require(newPlatformOwner != address(0), "Invalid address");
        platformOwner = newPlatformOwner;
    }

    function emergencyWithdraw() external onlyOwner {
        WLD_TOKEN.transfer(platformOwner, WLD_TOKEN.balanceOf(address(this)));
    }

    // New functions that can be added in future upgrades
    function getVersion() external pure returns (string memory) {
        return "1.0.0";
    }
}
