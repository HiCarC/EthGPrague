// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BookingPool.sol";
import "./MockYieldStrategy.sol";

contract BookingPoolFactoryV2 {
    // Structs
    struct Property {
        uint256 id;
        address owner;
        string name;
        string description;
        string location;
        string[] imageUrls;
        uint256 pricePerNight; // in wei
        uint256 maxGuests;
        bool isActive;
        uint256 createdAt;
    }

    // State variables
    mapping(uint256 => Property) public properties;
    mapping(address => uint256[]) public ownerProperties;
    mapping(string => address) public bookingPools;
    address[] public allPools;

    uint256 public nextPropertyId = 1;
    uint256 public platformFeePercentage = 5; // 5% platform fee
    address public platformOwner;
    address public yieldStrategy;

    // Events - Factory events
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

    // Events - Property events
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

    // Modifiers
    modifier onlyPropertyOwner(uint256 propertyId) {
        require(
            properties[propertyId].owner == msg.sender,
            "Not property owner"
        );
        _;
    }

    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Not platform owner");
        _;
    }

    modifier propertyExists(uint256 propertyId) {
        require(
            propertyId > 0 && propertyId < nextPropertyId,
            "Property does not exist"
        );
        _;
    }

    constructor(address _yieldStrategy) {
        platformOwner = msg.sender;
        yieldStrategy = _yieldStrategy;
    }

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

    // Pool Creation Functions
    function createBookingPool(
        string memory _bookingId,
        address _host,
        uint256 _totalAmount,
        uint256 _checkInDate,
        uint256 _checkOutDate,
        uint256 _maxParticipants
    ) external returns (address) {
        return
            _createBookingPoolInternal(
                _bookingId,
                _host,
                _totalAmount,
                _checkInDate,
                _checkOutDate,
                _maxParticipants
            );
    }

    function _createBookingPoolInternal(
        string memory _bookingId,
        address _host,
        uint256 _totalAmount,
        uint256 _checkInDate,
        uint256 _checkOutDate,
        uint256 _maxParticipants
    ) internal returns (address) {
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
            _maxParticipants,
            platformFeePercentage,
            platformOwner,
            yieldStrategy
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
            _maxParticipants,
            platformFeePercentage,
            platformOwner,
            yieldStrategy
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

    function createBookingPoolForProperty(
        uint256 propertyId,
        string memory _bookingId,
        uint256 _checkInDate,
        uint256 _checkOutDate,
        uint256 _maxParticipants,
        uint256 nights
    ) external propertyExists(propertyId) returns (address) {
        Property memory property = properties[propertyId];
        require(property.isActive, "Property is not active");

        uint256 totalAmount = property.pricePerNight * nights;

        return
            _createBookingPoolInternal(
                _bookingId,
                property.owner,
                totalAmount,
                _checkInDate,
                _checkOutDate,
                _maxParticipants
            );
    }

    // View Functions
    function getProperty(
        uint256 propertyId
    ) external view propertyExists(propertyId) returns (Property memory) {
        return properties[propertyId];
    }

    function getOwnerProperties(
        address owner
    ) external view returns (uint256[] memory) {
        return ownerProperties[owner];
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

    // Admin Functions
    function setPlatformFee(
        uint256 newFeePercentage
    ) external onlyPlatformOwner {
        require(newFeePercentage <= 20, "Fee cannot exceed 20%");
        platformFeePercentage = newFeePercentage;
    }

    function emergencyWithdraw() external onlyPlatformOwner {
        payable(platformOwner).transfer(address(this).balance);
    }
}
