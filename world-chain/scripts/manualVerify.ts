import { ethers } from 'ethers';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

// Manual verification for your specific pool
async function manualVerifyPool() {
  const poolAddress = '0xaECD35EA8d53BC387575d1Bf40F36E9132faCd23';
  
  // Constructor parameters for your pool
  const constructorParams = {
    bookingId: '1',
    host: '0x504b635B7E22F8DF7d037cf31639811AE583E9f0',
    totalAmount: '1000000000000000000', // 1 ETH in wei
    checkInDate: 1749245333,
    checkOutDate: 1749504533,
    maxParticipants: 4
  };
  
  console.log('🔍 Manually verifying pool:', poolAddress);
  console.log('📋 Constructor parameters:');
  console.log('  Booking ID:', constructorParams.bookingId);
  console.log('  Host:', constructorParams.host);
  console.log('  Total Amount:', ethers.formatEther(constructorParams.totalAmount), 'ETH');
  console.log('  Check-in Date:', new Date(constructorParams.checkInDate * 1000));
  console.log('  Check-out Date:', new Date(constructorParams.checkOutDate * 1000));
  console.log('  Max Participants:', constructorParams.maxParticipants);
  
  // Encode constructor arguments
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ['string', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
    [
      constructorParams.bookingId,
      constructorParams.host,
      constructorParams.totalAmount,
      constructorParams.checkInDate,
      constructorParams.checkOutDate,
      constructorParams.maxParticipants
    ]
  );
  
  console.log('\n🏗️  Encoded constructor args:', constructorArgs);
  
  try {
    const verifyCommand = [
      'forge verify-contract',
      poolAddress,
      'src/BookingPool.sol:BookingPool',
      '--chain-id 4801',
      `--constructor-args ${constructorArgs}`,
      '--verifier-url https://worldchain-sepolia.explorer.alchemy.com/api'
    ].join(' ');
    
    console.log('\n🚀 Running verification command...');
    console.log(verifyCommand);
    
    const result = execSync(verifyCommand, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    console.log('\n✅ Verification successful!');
    console.log(result);
    console.log('\n🔗 View verified contract: https://worldchain-sepolia.explorer.alchemy.com/address/' + poolAddress);
    
  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    
    if (error.stdout) {
      console.log('\n📤 stdout:', error.stdout);
    }
    if (error.stderr) {
      console.log('\n📥 stderr:', error.stderr);
    }
    
    console.log('\n📋 Try this command manually:');
    console.log(`forge verify-contract ${poolAddress} src/BookingPool.sol:BookingPool --chain-id 4801 --constructor-args ${constructorArgs}`);
  }
}

manualVerifyPool(); 