const axios = require('axios');

class CrossChainYieldStrategy {
  constructor() {
    this.chains = {
      worldchain: {
        name: "Worldchain",
        purpose: "User Interface & Rental Pools",
        rpc: "https://rpc.worldchain.org",
        protocols: ["BookingPools", "MockYield"]
      },
      berachain: {
        name: "Berachain", 
        purpose: "CDP Management & NECT Generation",
        rpc: "https://rpc.berachain.com",
        protocols: ["Beraborrow", "BEX", "Kodiak"]
      },
      arbitrum: {
        name: "Arbitrum",
        purpose: "Advanced Yield Strategies", 
        rpc: "https://arb1.arbitrum.io/rpc",
        protocols: ["Aave V3", "Uniswap V3", "GMX"]
      }
    };

    this.strategies = this.initializeStrategies();
  }

  initializeStrategies() {
    return {
      // Berachain Native Strategies
      berachain: [
        {
          name: "Beraborrow Stability Pool",
          protocol: "Beraborrow LSP",
          chain: "berachain",
          apy: 3.5,
          riskScore: 2,
          tvl: 2500000,
          type: "Native Stability",
          gasEstimate: 0.001 // BERA
        },
        {
          name: "BEX NECT/HONEY Pool",
          protocol: "BEX",
          chain: "berachain", 
          apy: 4.2,
          riskScore: 3,
          tvl: 1200000,
          type: "DEX LP",
          gasEstimate: 0.002
        }
      ],

      // Arbitrum Advanced Strategies
      arbitrum: [
        {
          name: "Aave USDC Supply",
          protocol: "Aave V3",
          chain: "arbitrum",
          apy: 3.8,
          riskScore: 2,
          tvl: 800000000,
          type: "Lending",
          gasEstimate: 0.0005, // ETH
          bridgeCost: 0.001
        },
        {
          name: "Aave Leveraged ETH",
          protocol: "Aave V3", 
          chain: "arbitrum",
          apy: 7.2,
          riskScore: 5,
          tvl: 400000000,
          type: "Leveraged",
          gasEstimate: 0.002,
          bridgeCost: 0.001
        },
        {
          name: "Uniswap V3 ETH/USDC",
          protocol: "Uniswap V3",
          chain: "arbitrum",
          apy: 12.5,
          riskScore: 6,
          tvl: 600000000,
          type: "Concentrated LP",
          gasEstimate: 0.003,
          bridgeCost: 0.001
        },
        {
          name: "Uniswap V3 USDC/USDT",
          protocol: "Uniswap V3",
          chain: "arbitrum", 
          apy: 5.8,
          riskScore: 3,
          tvl: 200000000,
          type: "Stable LP",
          gasEstimate: 0.002,
          bridgeCost: 0.001
        }
      ]
    };
  }

  // Main optimization function
  analyzeCrossChainOpportunity(amount, duration, riskTolerance) {
    console.log(`🌉 CROSS-CHAIN YIELD OPTIMIZATION`);
    console.log("=".repeat(60));
    console.log(`💰 Amount: ${amount.toLocaleString()} NECT`);
    console.log(`⏱️  Duration: ${duration} days`);
    console.log(`🎲 Risk Tolerance: ${riskTolerance}/10`);

    // Step 1: Berachain native opportunities
    const beraStrategies = this.strategies.berachain.filter(s => s.riskScore <= riskTolerance);
    
    // Step 2: Arbitrum opportunities (accounting for bridge costs)
    const arbStrategies = this.strategies.arbitrum.filter(s => s.riskScore <= riskTolerance);
    
    console.log(`\n🐻 Berachain Opportunities: ${beraStrategies.length}`);
    beraStrategies.forEach(s => {
      console.log(`  • ${s.name}: ${s.apy}% APY (Risk: ${s.riskScore})`);
    });

    console.log(`\n🟦 Arbitrum Opportunities: ${arbStrategies.length}`);
    arbStrategies.forEach(s => {
      const netAPY = this.calculateNetAPY(s, amount, duration);
      console.log(`  • ${s.name}: ${netAPY.toFixed(2)}% Net APY (${s.apy}% - bridge costs)`);
    });

    return this.calculateOptimalCrossChainAllocation(beraStrategies, arbStrategies, amount, duration);
  }

  calculateNetAPY(strategy, amount, duration) {
    // Calculate bridge costs impact on APY
    const bridgeCostUSD = strategy.bridgeCost * 2000; // Assume $2000 ETH
    const bridgeImpact = (bridgeCostUSD * 2 * 365) / (amount * duration); // Round trip * annualized
    return Math.max(0, strategy.apy - bridgeImpact);
  }

  calculateOptimalCrossChainAllocation(beraStrategies, arbStrategies, amount, duration) {
    console.log(`\n🎯 OPTIMAL CROSS-CHAIN ALLOCATION:`);
    console.log("=".repeat(60));

    // Combine and score all strategies
    const allStrategies = [
      ...beraStrategies.map(s => ({...s, netAPY: s.apy, chain: 'berachain'})),
      ...arbStrategies.map(s => ({...s, netAPY: this.calculateNetAPY(s, amount, duration), chain: 'arbitrum'}))
    ];

    // Score strategies (prefer native Berachain for lower amounts/shorter duration)
    const scoredStrategies = allStrategies.map(strategy => {
      let score = strategy.netAPY / Math.pow(strategy.riskScore, 1.5);
      
      // Bonus for staying native on Berachain (no bridge risk)
      if (strategy.chain === 'berachain') {
        score *= 1.2;
      }
      
      // Penalty for bridge costs on smaller amounts/shorter durations
      if (strategy.chain === 'arbitrum' && (amount < 5000 || duration < 14)) {
        score *= 0.8;
      }

      return { ...strategy, score };
    }).sort((a, b) => b.score - a.score);

    // Select top 3 strategies
    const selectedStrategies = scoredStrategies.slice(0, 3);
    const totalScore = selectedStrategies.reduce((sum, s) => sum + s.score, 0);

    let totalExpectedAPY = 0;
    const allocations = [];

    selectedStrategies.forEach(strategy => {
      const percentage = Math.round((strategy.score / totalScore) * 100);
      const allocation = (amount * percentage / 100);
      
      console.log(`🔸 ${strategy.name} (${strategy.chain})`);
      console.log(`   Allocation: ${percentage}% (${allocation.toLocaleString()} NECT)`);
      console.log(`   Expected APY: ${strategy.netAPY.toFixed(2)}%`);
      console.log(`   Chain: ${strategy.chain}`);
      console.log(`   Risk: ${strategy.riskScore}/10`);
      console.log();

      totalExpectedAPY += (strategy.netAPY * percentage / 100);
      
      allocations.push({
        strategy: strategy.name,
        chain: strategy.chain,
        percentage,
        amount: allocation,
        expectedAPY: strategy.netAPY,
        protocol: strategy.protocol
      });
    });

    console.log(`📊 PORTFOLIO SUMMARY:`);
    console.log("=".repeat(60));
    console.log(`Expected Portfolio APY: ${totalExpectedAPY.toFixed(2)}%`);
    console.log(`Cross-chain exposure: ${allocations.filter(a => a.chain === 'arbitrum').length > 0 ? 'Yes' : 'No'}`);
    console.log(`Primary chain: ${allocations[0].chain}`);

    // Calculate estimated returns
    const estimatedReturns = (amount * totalExpectedAPY / 100) * (duration / 365);
    console.log(`💰 Estimated ${duration}-day returns: ${estimatedReturns.toFixed(2)} NECT`);

    return { allocations, expectedAPY: totalExpectedAPY, estimatedReturns };
  }

  // Implementation guide
  generateImplementationGuide(allocations) {
    console.log(`\n🛠️  IMPLEMENTATION GUIDE:`);
    console.log("=".repeat(60));

    const berachainAllocations = allocations.filter(a => a.chain === 'berachain');
    const arbitrumAllocations = allocations.filter(a => a.chain === 'arbitrum');

    if (berachainAllocations.length > 0) {
      console.log(`🐻 Berachain Actions:`);
      berachainAllocations.forEach(alloc => {
        console.log(`   1. Deploy ${alloc.amount.toLocaleString()} NECT to ${alloc.strategy}`);
        console.log(`   2. Monitor position on ${alloc.protocol}`);
      });
    }

    if (arbitrumAllocations.length > 0) {
      console.log(`\n🟦 Arbitrum Actions:`);
      const totalArbitrumAmount = arbitrumAllocations.reduce((sum, a) => sum + a.amount, 0);
      console.log(`   1. Bridge ${totalArbitrumAmount.toLocaleString()} NECT to Arbitrum`);
      arbitrumAllocations.forEach(alloc => {
        console.log(`   2. Deploy ${alloc.amount.toLocaleString()} to ${alloc.strategy} on ${alloc.protocol}`);
      });
      console.log(`   3. Set up automated yield harvesting`);
      console.log(`   4. Bridge yields back to Worldchain for user distribution`);
    }

    console.log(`\n🔄 Yield Flow:`);
    console.log(`   Worldchain → Berachain → Arbitrum → Worldchain`);
    console.log(`   User deposits → CDP creation → Yield farming → User rewards`);
  }
}

// Demo scenarios
async function runCrossChainDemo() {
  const strategy = new CrossChainYieldStrategy();

  const scenarios = [
    {
      name: "Small Rental (3 days, $1000)",
      amount: 1000,
      duration: 3,
      risk: 4
    },
    {
      name: "Medium Rental (14 days, $5000)", 
      amount: 5000,
      duration: 14,
      risk: 6
    },
    {
      name: "Large Rental (30 days, $15000)",
      amount: 15000,
      duration: 30,
      risk: 7
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 SCENARIO: ${scenario.name}`);
    console.log(`${'='.repeat(80)}`);

    const result = strategy.analyzeCrossChainOpportunity(
      scenario.amount,
      scenario.duration,
      scenario.risk
    );

    strategy.generateImplementationGuide(result.allocations);
  }
}

if (require.main === module) {
  runCrossChainDemo().catch(console.error);
}

module.exports = { CrossChainYieldStrategy }; 