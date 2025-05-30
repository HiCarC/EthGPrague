import { ethers } from 'ethers';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const WORLDCHAIN_SEPOLIA_RPC = 'https://worldchain-sepolia.g.alchemy.com/public';
const FACTORY_V2_ADDRESS = process.env.FACTORY_V2_ADDRESS || '';

// Factory V2 ABI - focusing on events
const factoryV2ABI = [
  "event PoolCreatedWithDetails(address indexed pool, string bookingId, address host, uint256 totalAmount, uint256 checkInDate, uint256 checkOutDate, uint256 maxParticipants, bytes constructorArgs)"
];

class PoolVerifier {
  private provider: ethers.Provider;
  private factory: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_SEPOLIA_RPC);
    this.factory = new ethers.Contract(FACTORY_V2_ADDRESS, factoryV2ABI, this.provider);
  }

  async verifyAllCreatedPools(fromBlock: number = 0) {
    try {
      console.log('🔍 Searching for created pools to verify...');
      console.log('  Factory Address:', FACTORY_V2_ADDRESS);
      console.log('  From Block:', fromBlock);
      
      // Get all PoolCreatedWithDetails events
      const filter = this.factory.filters.PoolCreatedWithDetails();
      const events = await this.factory.queryFilter(filter, fromBlock);
      
      console.log(`📄 Found ${events.length} pool creation events`);
      
      if (events.length === 0) {
        console.log('⚠️  No pools found to verify');
        return;
      }
      
      // Verify each pool
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        console.log(`\n🏊 Pool ${i + 1}/${events.length}:`);
        
        try {
          await this.verifyPoolFromEvent(event);
        } catch (error: any) {
          console.error(`❌ Failed to verify pool ${event.args?.pool}:`, error.message);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error searching for pools:', error.message);
      throw error;
    }
  }
  
  async verifyPoolFromEvent(event: any) {
    const poolAddress = event.args.pool;
    const constructorArgs = event.args.constructorArgs;
    const bookingId = event.args.bookingId;
    
    console.log('  📍 Address:', poolAddress);
    console.log('  📝 Booking ID:', bookingId);
    console.log('  🏗️  Constructor Args:', constructorArgs);
    
    await this.verifyContract(poolAddress, constructorArgs);
  }
  
  async verifyContract(poolAddress: string, constructorArgs: string) {
    try {
      // Check if contract is already verified
      const isVerified = await this.checkIfVerified(poolAddress);
      if (isVerified) {
        console.log('  ✅ Already verified');
        return;
      }
      
      // Build verification command
      const verifyCommand = [
        'forge verify-contract',
        poolAddress,
        'src/BookingPool.sol:BookingPool',
        '--chain-id 4801',
        `--constructor-args ${constructorArgs}`,
        '--verifier-url https://worldchain-sepolia.explorer.alchemy.com/api'
      ].join(' ');
      
      console.log('  🚀 Verifying...');
      
      // Execute verification
      const result = execSync(verifyCommand, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        env: { ...process.env },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('  ✅ Verification successful!');
      console.log('  🔗 View: https://worldchain-sepolia.explorer.alchemy.com/address/' + poolAddress);
      
    } catch (error: any) {
      if (error.stdout && error.stdout.includes('already verified')) {
        console.log('  ✅ Already verified (detected from output)');
      } else if (error.stderr && error.stderr.includes('already verified')) {
        console.log('  ✅ Already verified (detected from error)');
      } else {
        console.log('  ❌ Verification failed');
        console.log('  📋 Manual command:');
        console.log(`     forge verify-contract ${poolAddress} src/BookingPool.sol:BookingPool --chain-id 4801 --constructor-args ${constructorArgs}`);
      }
    }
  }
  
  async checkIfVerified(address: string): Promise<boolean> {
    try {
      // Try to get contract source code from explorer API
      const response = await fetch(`https://worldchain-sepolia.explorer.alchemy.com/api?module=contract&action=getsourcecode&address=${address}`);
      const data = await response.json();
      
      return data.result && data.result[0] && data.result[0].SourceCode !== '';
    } catch {
      return false; // Assume not verified if check fails
    }
  }
  
  async verifySpecificPool(poolAddress: string) {
    try {
      console.log('🔍 Looking for specific pool:', poolAddress);
      
      // Find the event for this specific pool
      const filter = this.factory.filters.PoolCreatedWithDetails(poolAddress);
      const events = await this.factory.queryFilter(filter);
      
      if (events.length === 0) {
        throw new Error('Pool creation event not found');
      }
      
      const event = events[0];
      console.log('📄 Found creation event');
      await this.verifyPoolFromEvent(event);
      
    } catch (error: any) {
      console.error('❌ Error verifying specific pool:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!FACTORY_V2_ADDRESS) {
    throw new Error('❌ FACTORY_V2_ADDRESS not set in .env file');
  }
  
  const verifier = new PoolVerifier();
  
  if (command === 'all') {
    const fromBlock = args[1] ? parseInt(args[1]) : 0;
    await verifier.verifyAllCreatedPools(fromBlock);
  } else if (command === 'pool' && args[1]) {
    await verifier.verifySpecificPool(args[1]);
  } else {
    console.log('📋 Usage:');
    console.log('  npm run verify-pools all [fromBlock]     - Verify all created pools');
    console.log('  npm run verify-pools pool <address>     - Verify specific pool');
    console.log('');
    console.log('📖 Examples:');
    console.log('  npm run verify-pools all');
    console.log('  npm run verify-pools all 14000000');
    console.log('  npm run verify-pools pool 0xaECD35EA8d53BC387575d1Bf40F36E9132faCd23');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { PoolVerifier }; 