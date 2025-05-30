import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Load ABIs (make sure you run `npm run generate-abis` first)
const BookingPoolFactoryABI = require('./abis/BookingPoolFactoryV2.json');
const BookingPoolABI = require('./abis/BookingPool.json');

// Configuration
const WORLDCHAIN_SEPOLIA_RPC = 'https://worldchain-sepolia.g.alchemy.com/public';
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || 'YOUR_DEPLOYED_FACTORY_ADDRESS';

class WorldChainBookingInteractor {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private factory: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_SEPOLIA_RPC);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY not found');
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.factory = new ethers.Contract(FACTORY_ADDRESS, BookingPoolFactoryABI, this.signer);
  }

  // 🔑 Helper method to get signer address
  async getSignerAddress(): Promise<string> {
    return await this.signer.getAddress();
  }

  // 🏠 PROPERTY MANAGEMENT
  async createProperty(
    name: string,
    description: string,
    location: string,
    imageUrls: string[],
    pricePerNightETH: string,
    maxGuests: number
  ) {
    console.log(`🏠 Creating property: ${name}`);
    
    const pricePerNightWei = ethers.parseEther(pricePerNightETH);
    
    const tx = await this.factory.createProperty(
      name,
      description,
      location,
      imageUrls,
      pricePerNightWei,
      maxGuests
    );
    
    const receipt = await tx.wait();
    console.log(`✅ Property created! TX: ${tx.hash}`);
    
    // Get property ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = this.factory.interface.parseLog(log);
        return parsed?.name === 'PropertyCreated';
      } catch { return false; }
    });
    
    if (event) {
      const parsed = this.factory.interface.parseLog(event);
      const propertyId = parsed?.args.propertyId;
      console.log(`🆔 Property ID: ${propertyId}`);
      return propertyId;
    }
  }

  // 🏊 POOL CREATION
  async createBookingPool(
    bookingId: string,
    host: string,
    totalAmountETH: string,
    checkInDate: Date,
    checkOutDate: Date,
    maxParticipants: number
  ) {
    console.log(`🏊 Creating booking pool: ${bookingId}`);
    
    const totalAmountWei = ethers.parseEther(totalAmountETH);
    const checkInTimestamp = Math.floor(checkInDate.getTime() / 1000);
    const checkOutTimestamp = Math.floor(checkOutDate.getTime() / 1000);
    
    const tx = await this.factory.createBookingPool(
      bookingId,
      host,
      totalAmountWei,
      checkInTimestamp,
      checkOutTimestamp,
      maxParticipants
    );
    
    const receipt = await tx.wait();
    console.log(`✅ Pool created! TX: ${tx.hash}`);
    
    // Get pool address
    const poolAddress = await this.factory.bookingPools(bookingId);
    console.log(`🏊 Pool address: ${poolAddress}`);
    return poolAddress;
  }

  // 💰 JOIN POOL
  async joinPool(poolAddress: string, contributionETH: string) {
    console.log(`💰 Joining pool at: ${poolAddress}`);
    
    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.signer);
    const contributionWei = ethers.parseEther(contributionETH);
    
    const tx = await pool.joinPool({ value: contributionWei });
    const receipt = await tx.wait();
    
    console.log(`✅ Joined pool! TX: ${tx.hash}`);
    return receipt;
  }

  // 📊 VIEW FUNCTIONS
  async getPoolInfo(poolAddress: string) {
    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.provider);
    const info = await pool.getPoolInfo();
    
    return {
      bookingId: info[0],
      host: info[1],
      totalAmount: ethers.formatEther(info[2]),
      checkInDate: new Date(Number(info[3]) * 1000),
      checkOutDate: new Date(Number(info[4]) * 1000),
      maxParticipants: Number(info[5]),
      currentParticipants: Number(info[6]),
      totalContributed: ethers.formatEther(info[7]),
      fundsReleased: info[8],
      poolCanceled: info[9],
      status: info[10]
    };
  }

  async getPropertyInfo(propertyId: number) {
    const property = await this.factory.getProperty(propertyId);
    return {
      id: Number(property.id),
      owner: property.owner,
      name: property.name,
      description: property.description,
      location: property.location,
      imageUrls: property.imageUrls,
      pricePerNight: ethers.formatEther(property.pricePerNight),
      maxGuests: Number(property.maxGuests),
      isActive: property.isActive,
      createdAt: new Date(Number(property.createdAt) * 1000)
    };
  }

  // 🎯 HOST FUNCTIONS
  async confirmPool(poolAddress: string) {
    console.log(`✅ Confirming pool: ${poolAddress}`);
    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.signer);
    const tx = await pool.confirmPool();
    await tx.wait();
    console.log(`✅ Pool confirmed! TX: ${tx.hash}`);
  }

  async checkInPool(poolAddress: string) {
    console.log(`🏨 Checking in pool: ${poolAddress}`);
    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.signer);
    const tx = await pool.checkIn();
    await tx.wait();
    console.log(`✅ Checked in! TX: ${tx.hash}`);
  }

  async checkOutPool(poolAddress: string) {
    console.log(`🚪 Checking out pool: ${poolAddress}`);
    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.signer);
    const tx = await pool.checkOut();
    await tx.wait();
    console.log(`✅ Checked out and funds released! TX: ${tx.hash}`);
  }
}

// 🎭 EXAMPLE USAGE
async function demonstrateInteractions() {
  const interactor = new WorldChainBookingInteractor();
  
  try {
    // 1. Create a property
    console.log('\n=== 1. CREATING PROPERTY ===');
    const propertyId = await interactor.createProperty(
      "Cozy Downtown Apartment",
      "Beautiful 2BR apartment in city center",
      "Prague, Czech Republic",
      ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "0.1", // 0.1 ETH per night
      4 // max 4 guests
    );
    
    // 2. Create a booking pool
    console.log('\n=== 2. CREATING BOOKING POOL ===');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    const poolAddress = await interactor.createBookingPool(
      "BOOKING_" + Date.now(),
      await interactor.getSignerAddress(), // ✅ Fixed: using the getter method
      "0.4", // 0.4 ETH total (4 nights × 0.1 ETH)
      tomorrow,
      dayAfter,
      2 // max 2 participants
    );
    
    // 3. Get pool info
    console.log('\n=== 3. POOL INFORMATION ===');
    const poolInfo = await interactor.getPoolInfo(poolAddress);
    console.log('Pool Info:', poolInfo);
    
    // 4. Join pool (from another account)
    console.log('\n=== 4. JOINING POOL ===');
    await interactor.joinPool(poolAddress, "0.2"); // Contribute 0.2 ETH
    
    // 5. Get updated pool info
    const updatedInfo = await interactor.getPoolInfo(poolAddress);
    console.log('Updated Pool Info:', updatedInfo);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  demonstrateInteractions();
}

export default WorldChainBookingInteractor; 