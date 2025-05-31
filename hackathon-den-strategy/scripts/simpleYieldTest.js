const axios = require('axios');

async function testYieldAnalysis() {
  console.log("🚀 Simple Yield Analysis Test\n");

  // Mock protocol data
  const protocols = [
    {
      name: "BEX NECT/HONEY Pool",
      apy: 4.2,
      tvl: 1200000,
      riskScore: 3,
      liquidity: 600000,
      minLockPeriod: 0,
      fees: 0.3,
      isActive: true
    },
    {
      name: "Kodiak NECT Vault",
      apy: 6.8,
      tvl: 800000,
      riskScore: 4,
      liquidity: 300000,
      minLockPeriod: 86400,
      fees: 0.5,
      isActive: true
    },
    {
      name: "Beraborrow Stability Pool",
      apy: 3.5,
      tvl: 2500000,
      riskScore: 2,
      liquidity: 1000000,
      minLockPeriod: 0,
      fees: 0,
      isActive: true
    }
  ];

  // Test scenario: 7-day rental with 2500 NECT
  const duration = 7 * 24 * 3600; // 7 days
  const riskTolerance = 6;
  const amount = 2500;

  console.log(`📊 Analyzing ${amount} NECT for ${duration/86400} days (risk tolerance: ${riskTolerance})`);
  console.log("=".repeat(70));

  // Filter eligible protocols
  const eligible = protocols.filter(p => 
    p.isActive && 
    p.riskScore <= riskTolerance && 
    p.minLockPeriod <= duration
  );

  console.log(`✅ Found ${eligible.length} eligible protocols:`);
  eligible.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} - ${p.apy}% APY (Risk: ${p.riskScore})`);
  });

  // Simple allocation algorithm
  const totalScore = eligible.reduce((sum, p) => sum + (p.apy / p.riskScore), 0);
  
  console.log("\n🎯 OPTIMAL ALLOCATION:");
  console.log("=".repeat(70));
  
  let totalAPY = 0;
  eligible.forEach(protocol => {
    const score = protocol.apy / protocol.riskScore;
    const percentage = Math.round((score / totalScore) * 100);
    const allocation = (amount * percentage / 100);
    
    console.log(`• ${protocol.name}: ${percentage}% (${allocation.toLocaleString()} NECT)`);
    console.log(`  └─ Expected: ${(protocol.apy * percentage / 100).toFixed(2)}% APY contribution`);
    
    totalAPY += (protocol.apy * percentage / 100);
  });
  
  console.log("\n📈 STRATEGY SUMMARY:");
  console.log("=".repeat(70));
  console.log(`Expected Portfolio APY: ${totalAPY.toFixed(2)}%`);
  console.log(`Total Investment: ${amount.toLocaleString()} NECT`);
  console.log(`Projected 7-day earnings: ${(amount * totalAPY / 100 * 7 / 365).toFixed(2)} NECT`);
  
  // Test API connectivity
  console.log("\n🌐 Testing API Connectivity:");
  console.log("=".repeat(70));
  
  try {
    const response = await axios.get('https://api.llama.fi/protocols', { timeout: 5000 });
    console.log(`✅ DeFi Llama API: Connected (${response.data.length} protocols found)`);
  } catch (error) {
    console.log(`❌ DeFi Llama API: Failed (${error.message})`);
  }
  
  console.log("\n🎉 Analysis Complete!");
}

if (require.main === module) {
  testYieldAnalysis().catch(console.error);
}

module.exports = { testYieldAnalysis }; 

const aaveStrategies = [
  {
    name: "Aave USDC Lending",
    protocol: "Aave",
    apy: 3.2,
    riskScore: 2,
    strategy: "Simple lending",
    liquidity: "High"
  },
  {
    name: "Aave ETH Supply", 
    protocol: "Aave",
    apy: 2.8,
    riskScore: 3,
    strategy: "ETH collateral supply",
    liquidity: "Very High"
  }
]; 

const leveragedStrategies = [
  {
    name: "Aave ETH-USDC Loop",
    protocol: "Aave",
    apy: 8.5,
    riskScore: 6,
    strategy: "Supply ETH, borrow USDC, re-supply",
    risk: "Liquidation risk"
  },
  {
    name: "Aave Stablecoin Loop",
    protocol: "Aave", 
    apy: 5.2,
    riskScore: 4,
    strategy: "Supply/borrow stablecoin loop",
    risk: "Lower liquidation risk"
  }
]; 

const uniswapV3Strategies = [
  {
    name: "UNI V3 ETH/USDC (0.05%)",
    protocol: "Uniswap V3",
    apy: 25.7,
    riskScore: 7,
    strategy: "Concentrated liquidity",
    risk: "High IL + active management"
  },
  {
    name: "UNI V3 USDC/USDT (0.01%)",
    protocol: "Uniswap V3",
    apy: 8.2,
    riskScore: 4,
    strategy: "Stable pair concentration",
    risk: "Lower IL risk"
  }
]; 