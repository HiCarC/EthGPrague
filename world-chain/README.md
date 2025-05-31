# 🏠 WorldChain Booking Pool + Yield Strategy

A rental booking platform with integrated yield generation for user deposits.

## 🎯 Project Overview

This project creates **shared rental pools** where users contribute funds for Airbnb-style bookings, and their deposits **earn yield** while waiting for the rental period.

### Key Features

- 👥 **Shared Booking Pools**: Multiple users split rental costs
- 💰 **Yield Generation**: 10% yield on user deposits
- 🎁 **User Cashback**: Users get 80% of yield, platform gets 20%
- 🔒 **Escrow System**: Funds released only after checkout
- 🛡️ **Refund Protection**: Time-based refund calculations

## 📋 Deployed Contracts (WorldChain Sepolia)

| Contract                 | Address                                      | Description                       |
| ------------------------ | -------------------------------------------- | --------------------------------- |
| **BookingPoolFactoryV2** | `0x6a7484e85ce3aeca1fc6f16501505e39abd505aa` | Creates and manages booking pools |
| **MockYieldStrategy**    | `0x1fd979fa3537a148aa3b0064fde95d1d2ace9b9b` | Generates 10% yield on deposits   |

### 🌐 Explorer Links

- **Factory**: https://worldchain-sepolia.explorer.alchemy.com/address/0x6a7484e85ce3aeca1fc6f16501505e39abd505aa
- **Yield Strategy**: https://worldchain-sepolia.explorer.alchemy.com/address/0x1fd979fa3537a148aa3b0064fde95d1d2ace9b9b

## 🔧 Setup & Environment

### Prerequisites

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

```bash
# Required in .env file
PRIVATE_KEY=your_private_key_here
WORLDCHAIN_RPC_URL=https://worldchain-sepolia.g.alchemy.com/public
FACTORY_ADDRESS=0x6a7484e85ce3aeca1fc6f16501505e39abd505aa
YIELD_STRATEGY_ADDRESS=0x1fd979fa3537a148aa3b0064fde95d1d2ace9b9b
```

## 🚀 Available Scripts

### Development & Testing

```bash
# Generate contract ABIs
npm run generate-abis

# Test all contract functions
npm run test-contracts

# Deploy new contracts (if needed)
npm run deploy
```

### Contract Interactions

```bash
# Create a new booking pool
npm run create-booking

# Complete booking lifecycle demo
npm run demo

# Check existing pools
npm run check-pools
```

## 🏗️ Contract Architecture

### 1. BookingPoolFactoryV2

**Main factory contract that creates booking pools**

**Key Functions:**

```solidity
// Create a new booking pool
createBookingPool(
    string bookingId,
    address host,
    uint256 totalAmount,
    uint256 checkInDate,
    uint256 checkOutDate,
    uint256 maxParticipants
)

// Get pool address by booking ID
getPoolByBookingId(string bookingId) → address

// View all pools
getAllPools() → address[]
```

### 2. BookingPool

**Individual pool contract for each rental**

**Key Functions:**

```solidity
// Join a pool (contribute funds)
joinPool() payable

// Host confirms pool is full
confirmPool()

// Host checks in guests
checkIn()

// Host checks out guests (releases funds + distributes yield)
checkOut()

// Users claim their yield
claimYield()

// Get yield information
getYieldInfo() → (totalYield, userYield, platformYield, distributed, timeElapsed)
```

### 3. MockYieldStrategy

**Yield generation contract**

**Key Functions:**

```solidity
// Calculate user's earned yield
calculateYieldEarned(address user) → (userYield, platformYield)

// Fund the yield pool (for demo)
fundYieldPool() payable

// Get yield percentage (returns 10)
YIELD_PERCENTAGE() → uint256
```

## 📝 Complete User Flow

### 1. Create Pool

```typescript
// Host creates a pool
const tx = await factory.createBookingPool(
  "booking_123", // Unique booking ID
  hostAddress, // Host wallet address
  ethers.parseEther("1"), // Total rental cost
  checkInTimestamp, // Check-in date
  checkOutTimestamp, // Check-out date
  4 // Max participants
);
```

### 2. Users Join Pool

```typescript
// Users contribute their share
const pool = new ethers.Contract(poolAddress, BookingPoolABI, signer);
const sharePerPerson = await pool.getSharePerPerson(); // 0.25 ETH if total is 1 ETH / 4 people

await pool.joinPool({ value: sharePerPerson });
```

### 3. Rental Lifecycle

```typescript
// Host confirms when pool is full
await pool.confirmPool();

// Host checks in guests on arrival
await pool.checkIn();

// Host checks out guests (triggers yield distribution)
await pool.checkOut();
```

### 4. Claim Yield

```typescript
// Users claim their 10% yield (80% goes to users, 20% to platform)
await pool.claimYield();
```

## 🧪 Testing Examples

### Quick Test

```bash
# Run comprehensive contract tests
npm run test-contracts
```

**Test Results Example:**
✅ Factory Contract Info:
Platform Fee: 5%
Pools Count: 1
Yield Strategy: 0x1fd9...
✅ Pool Created:
Share per person: 0.005 ETH
Participants: 1
✅ Yield Information:
Estimated User Yield: 0.0004 ETH (10% of 0.005 ETH)
Platform gets: 20% of yield
User gets: 80% of yield

### Manual Testing

```typescript
// Get pool yield info
const yieldInfo = await pool.getYieldInfo();
console.log("User Yield:", ethers.formatEther(yieldInfo[1]), "ETH");

// Check user's claimable yield
const userYield = await pool.getUserYieldPreview(userAddress);
console.log("Claimable:", ethers.formatEther(userYield[1]), "ETH");
```

## 💰 Yield Mechanics

- **Rate**: 10% of deposited amount
- **Distribution**: 80% to users, 20% to platform
- **Timing**: Calculated from deposit time to checkout
- **Claiming**: Available after host checkout

**Example:**

- User deposits: 0.25 ETH
- Total yield: 0.025 ETH (10%)
- User gets: 0.02 ETH (80%)
- Platform gets: 0.005 ETH (20%)

## 🎯 Hackathon Integration

### For Frontend Team

```typescript
// Essential contract interactions
const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
const pool = new ethers.Contract(poolAddress, poolABI, signer);

// Create pool → Join pool → Claim yield
```

### For Berachain Integration

- Use same factory pattern
- Replace MockYieldStrategy with real Beraborrow strategy
- Keep same user interface

## 🔍 Debugging & Troubleshooting

### Common Issues

```bash
# Insufficient funds
Error: insufficient funds
# → Solution: Ensure wallet has enough ETH for gas + value

# Pool not found
Error: Pool already exists
# → Solution: Use unique booking ID

# Can't join pool
Error: Pool is full
# → Solution: Check maxParticipants limit
```

### Useful Commands

```bash
# Check contract state
cast call $FACTORY_ADDRESS "getPoolsCount()"

# Check user balance
cast balance $USER_ADDRESS --rpc-url $WORLDCHAIN_RPC_URL

# Get pool address
cast call $FACTORY_ADDRESS "getPoolByBookingId(string)" "booking_123"
```

## 🎉 Ready to Use!

The contracts are deployed and working. Your teammate can:

1. Run `npm run test-contracts` to see everything working
2. Use the factory address to create new pools
3. Integrate with your mini-app frontend
4. Deploy Berachain version with real yield strategy

**Happy building! 🚀**
