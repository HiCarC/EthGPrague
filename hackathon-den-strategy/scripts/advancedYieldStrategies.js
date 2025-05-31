const axios = require('axios');

class AdvancedYieldAnalyzer {
  constructor() {
    this.strategies = this.initializeStrategies();
  }

  initializeStrategies() {
    return {
      // Aave Strategies
      aave: [
        {
          name: "Aave USDC Supply",
          protocol: "Aave",
          type: "Lending",
          apy: 3.2,
          riskScore: 2,
          tvl: 2000000000,
          minAmount: 100,
          description: "Simple USDC lending on Aave",
          pros: ["Low risk", "High liquidity", "Stable returns"],
          cons: ["Lower yields", "Platform risk"]
        },
        {
          name: "Aave ETH Leveraged Loop",
          protocol: "Aave",
          type: "Leveraged",
          apy: 8.5,
          riskScore: 6,
          tvl: 500000000,
          minAmount: 1000,
          description: "Supply ETH, borrow stablecoin, compound",
          pros: ["Higher yields", "ETH exposure maintained"],
          cons: ["Liquidation risk", "Complex management"]
        }
      ],

      // Uniswap Strategies  
      uniswap: [
        {
          name: "UNI V2 ETH/USDC LP",
          protocol: "Uniswap V2", 
          type: "LP",
          apy: 15.3,
          riskScore: 5,
          tvl: 800000000,
          minAmount: 500,
          description: "50/50 liquidity provision",
          pros: ["Trading fees", "Token rewards", "Good liquidity"],
          cons: ["Impermanent loss", "Market risk"]
        },
        {
          name: "UNI V3 ETH/USDC Concentrated",
          protocol: "Uniswap V3",
          type: "Concentrated LP", 
          apy: 25.7,
          riskScore: 7,
          tvl: 600000000,
          minAmount: 1000,
          description: "Concentrated liquidity in price range",
          pros: ["Higher fee capture", "Capital efficiency"],
          cons: ["Active management", "High IL risk", "Out-of-range risk"]
        }
      ],

      // Cross-Protocol Strategies
      combined: [
        {
          name: "Aave-Uniswap Delta Neutral",
          protocol: "Multi-Protocol",
          type: "Delta Neutral",
          apy: 12.8,
          riskScore: 5,
          tvl: 100000000,
          minAmount: 2000,
          description: "Long ETH on Aave, short via Uniswap LP",
          pros: ["Market neutral", "Yield from both protocols"],
          cons: ["Complex execution", "Multiple platform risks"]
        },
        {
          name: "Leveraged LP Position",
          protocol: "Multi-Protocol", 
          type: "Leveraged LP",
          apy: 35.2,
          riskScore: 8,
          tvl: 50000000,
          minAmount: 5000,
          description: "Borrow on Aave to increase LP position",
          pros: ["Amplified returns", "Leverage on LP"],
          cons: ["High liquidation risk", "Double IL exposure"]
        }
      ],

      // Berachain (Your Focus)
      berachain: [
        {
          name: "BEX NECT/HONEY Pool",
          protocol: "BEX",
          type: "DEX LP",
          apy: 4.2,
          riskScore: 3,
          tvl: 1200000,
          minAmount: 100,
          description: "Native Berachain DEX liquidity",
          pros: ["Low fees", "Native chain", "POL rewards"],
          cons: ["New protocol", "Limited track record"]
        },
        {
          name: "Beraborrow CDP + Multi-Deploy",
          protocol: "Beraborrow",
          type: "CDP Management",
          apy: 8.7,
          riskScore: 4,
          tvl: 2500000,
          minAmount: 1000,
          description: "CDP with NECT deployed across multiple protocols",
          pros: ["Capital efficient", "Multiple yield sources"],
          cons: ["Liquidation risk", "Complex management"]
        }
      ]
    };
  }

  // Search strategies by criteria
  searchStrategies(filters = {}) {
    const {
      maxRisk = 10,
      minAPY = 0,
      protocols = [],
      types = [],
      maxAmount = Infinity,
      minAmount = 0
    } = filters;

    const allStrategies = [
      ...this.strategies.aave,
      ...this.strategies.uniswap, 
      ...this.strategies.combined,
      ...this.strategies.berachain
    ];

    return allStrategies.filter(strategy => {
      return strategy.riskScore <= maxRisk &&
             strategy.apy >= minAPY &&
             strategy.minAmount >= minAmount &&
             strategy.minAmount <= maxAmount &&
             (protocols.length === 0 || protocols.includes(strategy.protocol)) &&
             (types.length === 0 || types.includes(strategy.type));
    });
  }

  // Get optimal multi-protocol allocation
  getOptimalMultiProtocolAllocation(amount, duration, riskTolerance, preferences = {}) {
    console.log(`\n🌐 MULTI-PROTOCOL YIELD OPTIMIZATION`);
    console.log("=".repeat(60));
    console.log(`Amount: ${amount.toLocaleString()} tokens`);
    console.log(`Duration: ${duration} days`); 
    console.log(`Risk Tolerance: ${riskTolerance}/10`);

    const strategies = this.searchStrategies({
      maxRisk: riskTolerance,
      minAPY: preferences.minAPY || 0,
      maxAmount: amount
    });

    if (strategies.length === 0) {
      console.log("❌ No strategies found matching criteria");
      return null;
    }

    // Score strategies based on risk-adjusted returns
    const scoredStrategies = strategies.map(strategy => {
      const riskPenalty = Math.pow(strategy.riskScore, 1.5);
      const riskAdjustedReturn = strategy.apy / riskPenalty;
      const liquidityBonus = Math.min(strategy.tvl / 1000000, 5); // TVL bonus
      const durationScore = this.getDurationScore(strategy, duration);
      
      return {
        ...strategy,
        score: riskAdjustedReturn * liquidityBonus * durationScore,
        riskAdjustedReturn
      };
    }).sort((a, b) => b.score - a.score);

    console.log(`\n✅ Found ${strategies.length} eligible strategies:`);
    
    // Show top strategies
    const topStrategies = scoredStrategies.slice(0, 5);
    topStrategies.forEach((strategy, i) => {
      console.log(`${i+1}. ${strategy.name}`);
      console.log(`   Protocol: ${strategy.protocol} | Type: ${strategy.type}`);
      console.log(`   APY: ${strategy.apy}% | Risk: ${strategy.riskScore}/10`);
      console.log(`   Score: ${strategy.score.toFixed(2)}`);
      console.log();
    });

    return this.calculateOptimalAllocation(topStrategies, amount, preferences);
  }

  getDurationScore(strategy, duration) {
    // Different strategies work better for different durations
    if (duration <= 7) {
      // Short term - prefer liquid strategies
      return strategy.type === 'Lending' ? 1.2 : 
             strategy.type === 'LP' ? 0.9 : 1.0;
    } else if (duration <= 30) {
      // Medium term - balanced approach
      return strategy.type === 'Leveraged' ? 1.1 :
             strategy.type === 'Concentrated LP' ? 1.0 : 1.0;
    } else {
      // Long term - can handle more complex strategies
      return strategy.type === 'Delta Neutral' ? 1.2 :
             strategy.type === 'Leveraged LP' ? 1.1 : 1.0;
    }
  }

  calculateOptimalAllocation(strategies, amount, preferences) {
    const maxStrategies = preferences.maxStrategies || 3;
    const selectedStrategies = strategies.slice(0, maxStrategies);
    
    const totalScore = selectedStrategies.reduce((sum, s) => sum + s.score, 0);
    
    console.log(`🎯 OPTIMAL ALLOCATION (${selectedStrategies.length} strategies):`);
    console.log("=".repeat(60));
    
    let totalAPY = 0;
    const allocations = selectedStrategies.map(strategy => {
      const percentage = Math.round((strategy.score / totalScore) * 100);
      const allocation = (amount * percentage / 100);
      
      console.log(`• ${strategy.name}: ${percentage}%`);
      console.log(`  Amount: ${allocation.toLocaleString()} tokens`);
      console.log(`  Expected: +${(strategy.apy * percentage / 100).toFixed(2)}% APY`);
      console.log(`  Risk Level: ${strategy.riskScore}/10`);
      console.log();
      
      totalAPY += (strategy.apy * percentage / 100);
      
      return {
        strategy: strategy.name,
        protocol: strategy.protocol,
        percentage,
        amount: allocation,
        expectedAPY: strategy.apy * percentage / 100
      };
    });

    console.log(`📊 PORTFOLIO SUMMARY:`);
    console.log("=".repeat(60));
    console.log(`Expected Portfolio APY: ${totalAPY.toFixed(2)}%`);
    console.log(`Diversification: ${allocations.length} protocols`);
    console.log(`Risk Profile: ${this.calculatePortfolioRisk(selectedStrategies).toFixed(1)}/10`);

    return {
      allocations,
      expectedAPY: totalAPY,
      riskScore: this.calculatePortfolioRisk(selectedStrategies)
    };
  }

  calculatePortfolioRisk(strategies) {
    const weights = strategies.map(s => s.score);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return strategies.reduce((risk, strategy, i) => {
      return risk + (strategy.riskScore * weights[i] / totalWeight);
    }, 0);
  }

  // Fetch live data for real strategies
  async fetchLiveYieldData() {
    console.log("🔄 Fetching live yield data from multiple sources...");
    
    try {
      // DeFi Llama yields API
      const yieldsResponse = await axios.get('https://yields.llama.fi/pools', { timeout: 10000 });
      const pools = yieldsResponse.data.data;
      
      console.log(`✅ DeFi Llama: ${pools.length} yield pools found`);
      
      // Filter for major protocols
      const aavePools = pools.filter(p => p.project === 'aave-v3');
      const uniswapPools = pools.filter(p => p.project === 'uniswap-v3');
      
      console.log(`🏦 Aave pools: ${aavePools.length}`);
      console.log(`🦄 Uniswap pools: ${uniswapPools.length}`);
      
      // Show top opportunities
      const topYields = pools
        .filter(p => p.apy > 5 && p.tvlUsd > 1000000)
        .sort((a, b) => b.apy - a.apy)
        .slice(0, 10);
        
      console.log(`\n🏆 Top 10 Live Yield Opportunities:`);
      topYields.forEach((pool, i) => {
        console.log(`${i+1}. ${pool.symbol} on ${pool.project}`);
        console.log(`   APY: ${pool.apy.toFixed(2)}% | TVL: $${pool.tvlUsd.toLocaleString()}`);
      });
      
      return pools;
      
    } catch (error) {
      console.log(`❌ Error fetching live data: ${error.message}`);
      return [];
    }
  }
}

// Example usage
async function runAdvancedAnalysis() {
  const analyzer = new AdvancedYieldAnalyzer();
  
  // Fetch live data
  await analyzer.fetchLiveYieldData();
  
  // Test different scenarios
  const scenarios = [
    {
      name: "Conservative Multi-Protocol",
      amount: 10000,
      duration: 14,
      risk: 4,
      preferences: { minAPY: 3, maxStrategies: 2 }
    },
    {
      name: "Aggressive Yield Farming", 
      amount: 5000,
      duration: 30,
      risk: 7,
      preferences: { minAPY: 10, maxStrategies: 4 }
    },
    {
      name: "Berachain Focus",
      amount: 2500,
      duration: 7,
      risk: 5,
      preferences: { protocols: ['BEX', 'Beraborrow'], maxStrategies: 3 }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 SCENARIO: ${scenario.name}`);
    console.log(`${'='.repeat(80)}`);
    
    analyzer.getOptimalMultiProtocolAllocation(
      scenario.amount,
      scenario.duration, 
      scenario.risk,
      scenario.preferences
    );
  }
}

if (require.main === module) {
  runAdvancedAnalysis().catch(console.error);
}

module.exports = { AdvancedYieldAnalyzer }; 