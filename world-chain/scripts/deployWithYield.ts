import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

async function deploy() {
  console.log('🚀 Deploying WorldChain contracts with yield strategy...');
  
  // Check environment variables
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file');
    process.exit(1);
  }
  
  if (!process.env.WORLDCHAIN_RPC_URL) {
    console.error('❌ WORLDCHAIN_RPC_URL not found in .env file');
    console.log('💡 Add this to your .env file:');
    console.log('WORLDCHAIN_RPC_URL=https://worldchain-sepolia.g.alchemy.com/public');
    process.exit(1);
  }
  
  try {
    // Generate ABIs first
    console.log('📋 Generating ABIs...');
    execSync('npm run generate-abis', { stdio: 'inherit' });
    
    // Deploy contracts
    console.log('🏗️ Deploying contracts...');
    const deployCommand = `forge script script/Deploy.s.sol --broadcast --rpc-url ${process.env.WORLDCHAIN_RPC_URL} --slow --legacy`;
    
    execSync(deployCommand, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    console.log('✅ Deployment complete!');
    console.log('📝 Check the console output above for contract addresses');
    console.log('💡 Update your .env file with the new addresses');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
