import { execSync } from 'child_process';
import * as fs from 'fs';

async function generateABIs() {
  console.log('🔨 Building contracts...');
  execSync('forge build', { stdio: 'inherit' });

  console.log('📄 Generating ABI files...');
  
  // Create abis directory if it doesn't exist
  if (!fs.existsSync('scripts/abis')) {
    fs.mkdirSync('scripts/abis', { recursive: true });
  }

  // Generate Factory ABI
  const factoryABI = JSON.parse(
    execSync('jq .abi out/BookingPoolFactory.sol/BookingPoolFactoryV2.json', { encoding: 'utf8' })
  );
  fs.writeFileSync('scripts/abis/BookingPoolFactoryV2.json', JSON.stringify(factoryABI, null, 2));

  // Generate Pool ABI
  const poolABI = JSON.parse(
    execSync('jq .abi out/BookingPool.sol/BookingPool.json', { encoding: 'utf8' })
  );
  fs.writeFileSync('scripts/abis/BookingPool.json', JSON.stringify(poolABI, null, 2));

  console.log('✅ ABI files generated:');
  console.log('  - scripts/abis/BookingPoolFactoryV2.json');
  console.log('  - scripts/abis/BookingPool.json');
}

generateABIs().catch(console.error); 