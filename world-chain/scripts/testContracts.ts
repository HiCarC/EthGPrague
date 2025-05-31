import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import BookingPoolFactoryABI from './abis/BookingPoolFactoryV2.json';
import BookingPoolABI from './abis/BookingPool.json';
import MockYieldStrategyABI from './abis/MockYieldStrategy.json';

dotenv.config();

const WORLDCHAIN_RPC_URL = process.env.WORLDCHAIN_RPC_URL || 'https://worldchain-sepolia.g.alchemy.com/public';
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x6a7484e85ce3aeca1fc6f16501505e39abd505aa';
const YIELD_STRATEGY_ADDRESS = process.env.YIELD_STRATEGY_ADDRESS || '0x1fd979fa3537a148aa3b0064fde95d1d2ace9b9b';

class ContractTester {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private factory: ethers.Contract;
  private yieldStrategy: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC_URL);
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY not found');
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.factory = new ethers.Contract(FACTORY_ADDRESS, BookingPoolFactoryABI, this.signer);
    this.yieldStrategy = new ethers.Contract(YIELD_STRATEGY_ADDRESS, MockYieldStrategyABI, this.signer);
  }

  async testContractBasics() {
    console.log('🧪 Testing Contract Basics...\n');

    // Test Factory
    console.log('📊 Factory Contract Info:');
    console.log('  Address:', FACTORY_ADDRESS);
    console.log('  Platform Owner:', await this.factory.platformOwner());
    console.log('  Platform Fee:', await this.factory.platformFeePercentage(), '%');
    console.log('  Pools Count:', await this.factory.getPoolsCount());
    console.log('  Yield Strategy:', await this.factory.yieldStrategy());

    // Test Yield Strategy
    console.log('\n💎 Yield Strategy Info:');
    console.log('  Address:', YIELD_STRATEGY_ADDRESS);
    console.log('  Platform Owner:', await this.yieldStrategy.platformOwner());
    console.log('  Yield Percentage:', await this.yieldStrategy.YIELD_PERCENTAGE(), '%');
    console.log('  Contract Balance:', ethers.formatEther(await this.provider.getBalance(YIELD_STRATEGY_ADDRESS)), 'ETH');
  }

  async testCreateBookingPool() {
    console.log('\n🏠 Testing Booking Pool Creation...\n');

    const bookingId = `test_${Date.now()}`;
    const hostAddress = await this.signer.getAddress();
    const totalAmount = ethers.parseEther('0.02'); // 🔧 Changed: 0.02 ETH total (was 1.0 ETH)
    const checkInDate = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Tomorrow
    const checkOutDate = checkInDate + (2 * 24 * 60 * 60); // Day after tomorrow
    const maxParticipants = 4;

    console.log('Creating pool with:');
    console.log('  Booking ID:', bookingId);
    console.log('  Host:', hostAddress);
    console.log('  Total Amount:', ethers.formatEther(totalAmount), 'ETH');
    console.log('  Max Participants:', maxParticipants);
    console.log('  Check-in Date:', new Date(checkInDate * 1000).toLocaleString());
    console.log('  Check-out Date:', new Date(checkOutDate * 1000).toLocaleString());

    try {
      const tx = await this.factory.createBookingPool(
        bookingId,
        hostAddress,
        totalAmount,
        checkInDate,
        checkOutDate,
        maxParticipants
      );

      console.log('\n📤 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      // Get pool address
      const poolAddress = await this.factory.getPoolByBookingId(bookingId);
      console.log('🏊 Pool created at:', poolAddress);

      return { bookingId, poolAddress };
    } catch (error) {
      console.error('❌ Failed to create pool:', error);
      throw error;
    }
  }

  async testJoinPool(poolAddress: string) {
    console.log('\n👥 Testing Pool Joining...\n');

    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.signer);
    const sharePerPerson = await pool.getSharePerPerson();
    
    console.log('Share per person:', ethers.formatEther(sharePerPerson), 'ETH');
    console.log('Attempting to join pool...');

    try {
      const tx = await pool.joinPool({ value: sharePerPerson });
      console.log('📤 Join transaction:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Successfully joined pool!');
      
      // Check pool status
      const participantsCount = await pool.getParticipantsCount();
      console.log('👥 Total participants:', participantsCount.toString());

      return true;
    } catch (error) {
      console.error('❌ Failed to join pool:', error);
      return false;
    }
  }

  async testYieldInfo(poolAddress: string) {
    console.log('\n💰 Testing Yield Information...\n');

    const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.signer);
    
    try {
      const yieldInfo = await pool.getYieldInfo();
      console.log('📊 Yield Information:');
      console.log('  Estimated Total Yield:', ethers.formatEther(yieldInfo[0]), 'ETH');
      console.log('  Estimated User Yield:', ethers.formatEther(yieldInfo[1]), 'ETH');
      console.log('  Estimated Platform Yield:', ethers.formatEther(yieldInfo[2]), 'ETH');
      console.log('  Yield Distributed:', yieldInfo[3]);
      console.log('  Time Elapsed:', yieldInfo[4].toString(), 'seconds');

      // Check user's yield preview
      const userAddress = await this.signer.getAddress();
      const userYield = await pool.getUserYieldPreview(userAddress);
      console.log('\n👤 Your Yield Preview:');
      console.log('  Pending Yield:', ethers.formatEther(userYield[0]), 'ETH');
      console.log('  Claimable Yield:', ethers.formatEther(userYield[1]), 'ETH');

    } catch (error) {
      console.error('❌ Failed to get yield info:', error);
    }
  }

  async fundYieldStrategy() {
    console.log('\n💰 Funding Yield Strategy for Payouts...\n');
    
    try {
      const fundAmount = ethers.parseEther('0.01'); // 🔧 Changed: 0.01 ETH (was 10 ETH)
      const tx = await this.yieldStrategy.fundYieldPool({ value: fundAmount });
      
      console.log('📤 Funding transaction:', tx.hash);
      await tx.wait();
      console.log('✅ Yield strategy funded with', ethers.formatEther(fundAmount), 'ETH');
      
      const balance = await this.provider.getBalance(YIELD_STRATEGY_ADDRESS);
      console.log('💰 New balance:', ethers.formatEther(balance), 'ETH');
    } catch (error) {
      console.error('❌ Failed to fund yield strategy:', error);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting Contract Tests...\n');
    
    const tester = new ContractTester();
    
    // Test 1: Basic contract info
    await tester.testContractBasics();
    
    // Test 2: Fund yield strategy
    await tester.fundYieldStrategy();
    
    // Test 3: Create a booking pool
    const { bookingId, poolAddress } = await tester.testCreateBookingPool();
    
    // Test 4: Join the pool
    await tester.testJoinPool(poolAddress);
    
    // Test 5: Check yield info
    await tester.testYieldInfo(poolAddress);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Pool Details:');
    console.log('  Booking ID:', bookingId);
    console.log('  Pool Address:', poolAddress);
    console.log('  Explorer:', `https://worldchain-sepolia.explorer.alchemy.com/address/${poolAddress}`);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

main(); 