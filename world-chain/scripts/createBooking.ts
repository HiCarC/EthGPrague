import { ethers } from 'ethers';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import BookingPoolFactoryABI from './abis/BookingPoolFactory.json';
import BookingPoolABI from './abis/BookingPool.json';

// Load environment variables
dotenv.config();

// Network configuration
const WORLDCHAIN_SEPOLIA_RPC = 'https://worldchain-sepolia.g.alchemy.com/public';
const WORLDCHAIN_MAINNET_RPC = 'https://worldchain-mainnet.g.alchemy.com/public';

// Contract addresses (replace with your deployed address)
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0xe8F829fA5571Da7C6Fc59000F66ac72a2b38ccb0'; // Replace with your deployed address

interface BookingParams {
  bookingId: string;
  host: string;
  totalAmount: string; // in ETH
  checkInDate: Date;
  checkOutDate: Date;
  maxParticipants: number;
}

class BookingPoolManager {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private factory: ethers.Contract;

  constructor(useMainnet: boolean = false) {
    // Setup provider
    const rpcUrl = useMainnet ? WORLDCHAIN_MAINNET_RPC : WORLDCHAIN_SEPOLIA_RPC;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Setup signer
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    // Setup factory contract
    this.factory = new ethers.Contract(FACTORY_ADDRESS, BookingPoolFactoryABI, this.signer);
  }

  async createBooking(params: BookingParams): Promise<string> {
    try {
      console.log('🏠 Creating booking pool with parameters:');
      console.log('  📝 Booking ID:', params.bookingId);
      console.log('  🏡 Host:', params.host);
      console.log('  💰 Total Amount:', params.totalAmount, 'ETH');
      console.log('  📅 Check-in:', params.checkInDate.toLocaleDateString());
      console.log('  📅 Check-out:', params.checkOutDate.toLocaleDateString());
      console.log('  👥 Max Participants:', params.maxParticipants);
      
      // Convert parameters to blockchain format
      const totalAmountWei = ethers.parseEther(params.totalAmount);
      const checkInTimestamp = Math.floor(params.checkInDate.getTime() / 1000);
      const checkOutTimestamp = Math.floor(params.checkOutDate.getTime() / 1000);
      
      console.log('\n⏰ Converted timestamps:');
      console.log('  Check-in timestamp:', checkInTimestamp);
      console.log('  Check-out timestamp:', checkOutTimestamp);
      console.log('  Total amount (wei):', totalAmountWei.toString());
      
      // Check if booking already exists
      const existingPool = await this.factory.bookingPools(params.bookingId);
      if (existingPool !== '0x0000000000000000000000000000000000000000') {
        throw new Error(`Booking with ID ${params.bookingId} already exists at ${existingPool}`);
      }
      
      // Get current network info
      const network = await this.provider.getNetwork();
      console.log('\n🌐 Network Info:');
      console.log('  Chain ID:', network.chainId.toString());
      console.log('  Network Name:', network.name);
      
      // Get signer address and balance
      const signerAddress = await this.signer.getAddress();
      const balance = await this.provider.getBalance(signerAddress);
      console.log('  Signer Address:', signerAddress);
      console.log('  Signer Balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance === 0n) {
        throw new Error('Insufficient balance for transaction');
      }
      
      // Estimate gas
      const gasEstimate = await this.factory.createBookingPool.estimateGas(
        params.bookingId,
        params.host,
        totalAmountWei,
        checkInTimestamp,
        checkOutTimestamp,
        params.maxParticipants
      );
      
      console.log('\n⛽ Gas Estimate:', gasEstimate.toString());
      
      // Create the booking pool
      console.log('\n🚀 Sending transaction...');
      const tx = await this.factory.createBookingPool(
        params.bookingId,
        params.host,
        totalAmountWei,
        checkInTimestamp,
        checkOutTimestamp,
        params.maxParticipants,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );
      
      console.log('📤 Transaction hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        console.log('✅ Transaction confirmed!');
        console.log('  Block number:', receipt.blockNumber);
        console.log('  Gas used:', receipt.gasUsed.toString());
        
        // Get the pool address from events or fallback to query
        let poolAddress: string;
        try {
          const poolCreatedEvent = receipt.logs.find((log: any) => {
            try {
              const parsed = this.factory.interface.parseLog(log);
              return parsed?.name === 'PoolCreated';
            } catch {
              return false;
            }
          });
          
          if (poolCreatedEvent) {
            const parsed = this.factory.interface.parseLog(poolCreatedEvent);
            poolAddress = parsed?.args.pool;
            console.log('🏊 Pool created at address:', poolAddress);
          } else {
            throw new Error('Event not found');
          }
        } catch {
          // Fallback: query the contract
          poolAddress = await this.factory.bookingPools(params.bookingId);
          console.log('🏊 Pool address (from query):', poolAddress);
        }
        
        return poolAddress;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('❌ Error creating booking:', error.message);
      throw error;
    }
  }

  async getPoolInfo(poolAddress: string) {
    try {
      const pool = new ethers.Contract(poolAddress, BookingPoolABI, this.provider);
      const info = await pool.getPoolInfo();
      
      console.log('\n📊 Pool Information:');
      console.log('  📝 Booking ID:', info[0]);
      console.log('  🏡 Host:', info[1]);
      console.log('  💰 Total Amount:', ethers.formatEther(info[2]), 'ETH');
      console.log('  📅 Check-in:', new Date(Number(info[3]) * 1000).toLocaleDateString());
      console.log('  📅 Check-out:', new Date(Number(info[4]) * 1000).toLocaleDateString());
      console.log('  👥 Max Participants:', info[5].toString());
      console.log('  👥 Current Participants:', info[6].toString());
      console.log('  💰 Total Contributed:', ethers.formatEther(info[7]), 'ETH');
      console.log('  ✅ Funds Released:', info[8]);
      console.log('  ❌ Pool Canceled:', info[9]);
      
      // Get share per person
      const sharePerPerson = await pool.getSharePerPerson();
      console.log('  💸 Share per person:', ethers.formatEther(sharePerPerson), 'ETH');
      
      return info;
    } catch (error: any) {
      console.error('❌ Error getting pool info:', error.message);
      throw error;
    }
  }
}

// Main execution function
async function main() {
  try {
    // Initialize the booking manager (false = testnet, true = mainnet)
    const manager = new BookingPoolManager(false); // Using testnet
    
    // Define booking parameters
    const bookingParams: BookingParams = {
      bookingId: "1",
      host: "0x504b635B7E22F8DF7d037cf31639811AE583E9f0",
      totalAmount: "1.0", // 1 ETH total
      checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      checkOutDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      maxParticipants: 4
    };
    
    console.log('🎯 Starting booking creation process...\n');
    
    // Create the booking
    const poolAddress = await manager.createBooking(bookingParams);
    
    // Get and display pool information
    console.log('\n🔍 Fetching pool information...');
    await manager.getPoolInfo(poolAddress);
    
    console.log('\n🎉 Booking pool created successfully!');
    console.log('📋 Summary:');
    console.log('  🏊 Pool Address:', poolAddress);
    console.log('  💸 Share per person:', ethers.formatEther(ethers.parseEther(bookingParams.totalAmount) / BigInt(bookingParams.maxParticipants)), 'ETH');
    console.log('  🔗 View on explorer: https://worldchain-sepolia.explorer.alchemy.com/address/' + poolAddress);
    
  } catch (error: any) {
    console.error('💥 Failed to create booking:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { BookingPoolManager };