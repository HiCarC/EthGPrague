const axios = require('axios');

class TimePeriodYieldAnalyzer {
  constructor() {
    this.strategies = this.initializeStrategies();
    this.timePeriods = {
      short: { days: 7, name: "7 Days (Short-term Rental)" },
      medium: { days: 30, name: "30 Days (Monthly Rental)" },
      long: { days: 90, name: "3 Months (Long-term Rental)" }
    };
  }

  initializeStrategies() {
    return [
      // Quick/Liquid Strategies (Good for short-term)
      {
        name: "Aave USDC Supply",
        protocol: "Aave V3",
        type: "Lending",
        chain: "Arbitrum",
        apy: 3.8,
        riskScore: 2,
        tvl: 800000000,
        setupCost: 15, // USD in gas
        managementCost: 0, // USD per day
        liquidityCost: 2, // USD to exit
        timeEfficiency: "high", // Works well for short periods
        complexity: "low"
      },
      {
        name: "Beraborrow Stability Pool",
        protocol: "Beraborrow",
        type: "Stability",
        chain: "Berachain", 
        apy: 3.5,
        riskScore: 2,
        tvl: 2500000,
        setupCost: 5,
        managementCost: 0,
        liquidityCost: 2,
        timeEfficiency: "high",
        complexity: "low"
      },

      // Medium Complexity (Good for 30 days)
      {
        name: "Uniswap V3 USDC/USDT",
        protocol: "Uniswap V3",
        type: "Stable LP",
        chain: "Arbitrum",
        apy: 6.8,
        riskScore: 3,
        tvl: 200000000,
        setupCost: 25,
        managementCost: 0.5, // Rebalancing costs
        liquidityCost: 15,
        timeEfficiency: "medium",
        complexity: "medium"
      },
      {
        name: "BEX NECT/HONEY Pool",
        protocol: "BEX",
        type: "DEX LP",
        chain: "Berachain",
        apy: 4.2,
        riskScore: 3,
        tvl: 1200000,
        setupCost: 8,
        managementCost: 0.2,
        liquidityCost: 3,
        timeEfficiency: "medium", 
        complexity: "low"
      },

      // Advanced Strategies (Best for 3+ months)
      {
        name: "Aave Leveraged ETH Strategy",
        protocol: "Aave V3",
        type: "Leveraged",
        chain: "Arbitrum",
        apy: 12.5,
        riskScore: 6,
        tvl: 400000000,
        setupCost: 50,
        managementCost: 1.0, // Daily monitoring/rebalancing
        liquidityCost: 30,
        timeEfficiency: "low", // Needs time to compound
        complexity: "high"
      },
      {
        name: "Uniswap V3 ETH/USDC Concentrated",
        protocol: "Uniswap V3", 
        type: "Concentrated LP",
        chain: "Arbitrum",
        apy: 18.7,
        riskScore: 7,
        tvl: 600000000,
        setupCost: 40,
        managementCost: 2.0, // Active management required
        liquidityCost: 25,
        timeEfficiency: "low",
        complexity: "high"
      },
      {
        name: "Delta Neutral Aave-Uniswap",
        protocol: "Multi-Protocol",
        type: "Delta Neutral",
        chain: "Arbitrum",
        apy: 15.3,
        riskScore: 5,
        tvl: 100000000,
        setupCost: 75, // Complex setup
        managementCost: 1.5,
        liquidityCost: 40,
        timeEfficiency: "low",
        complexity: "very high"
      },

      // Berachain Advanced (Growing with time)
      {
        name: "Beraborrow CDP Multi-Deploy",
        protocol: "Beraborrow",
        type: "CDP Management", 
        chain: "Berachain",
        apy: 9.2,
        riskScore: 4,
        tvl: 2500000,
        setupCost: 20,
        managementCost: 0.8,
        liquidityCost: 10,
        timeEfficiency: "medium",
        complexity: "medium"
      }
    ];
  }

  // Calculate net APY accounting for time-based costs
  calculateNetAPY(strategy, amount, days) {
    const annualizedAmount = amount;
    const totalSetupCost = strategy.setupCost;
    const totalManagementCost = strategy.managementCost * days;
    const totalLiquidityCost = strategy.liquidityCost;
    const totalCosts = totalSetupCost + totalManagementCost + totalLiquidityCost;

    // Annualize the cost impact
    const costImpactAPY = (totalCosts * 365) / (annualizedAmount * days);
    
    // Time efficiency penalty for short periods
    let timeEfficiencyMultiplier = 1.0;
    if (days <= 7 && strategy.timeEfficiency === "low") {
      timeEfficiencyMultiplier = 0.6; // 40% penalty for short-term use of long-term strategies
    } else if (days <= 30 && strategy.timeEfficiency === "low") {
      timeEfficiencyMultiplier = 0.8; // 20% penalty
    }

    const netAPY = Math.max(0, (strategy.apy * timeEfficiencyMultiplier) - costImpactAPY);
    return netAPY;
  }

  // Analyze all time periods
  analyzeAllTimePeriods(amount = 5000, riskTolerance = 6) {
    console.log(`🕐 COMPREHENSIVE TIME PERIOD ANALYSIS`);
    console.log("=".repeat(80));
    console.log(`Investment Amount: ${amount.toLocaleString()} NECT`);
    console.log(`Risk Tolerance: ${riskTolerance}/10`);
    console.log(`Analysis Date: ${new Date().toLocaleDateString()}\n`);

    const results = {};

    // Analyze each time period
    Object.entries(this.timePeriods).forEach(([period, config]) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`⏰ ${config.name.toUpperCase()}`);
      console.log(`${'='.repeat(60)}`);
      
      results[period] = this.analyzeTimePeriod(amount, config.days, riskTolerance);
    });

    // Comparative summary
    this.generateComparativeSummary(results, amount);
    
    return results;
  }

  analyzeTimePeriod(amount, days, riskTolerance) {
    // Filter eligible strategies
    const eligibleStrategies = this.strategies.filter(strategy => 
      strategy.riskScore <= riskTolerance
    );

    // Calculate net APY for each strategy
    const analyzedStrategies = eligibleStrategies.map(strategy => {
      const netAPY = this.calculateNetAPY(strategy, amount, days);
      const grossReturn = (amount * strategy.apy / 100) * (days / 365);
      const netReturn = (amount * netAPY / 100) * (days / 365);
      const efficiency = netAPY / strategy.apy; // How much of gross APY we keep

      return {
        ...strategy,
        netAPY,
        grossReturn,
        netReturn,
        efficiency,
        score: netAPY / Math.pow(strategy.riskScore, 1.5)
      };
    }).sort((a, b) => b.score - a.score);

    console.log(`📊 Top Strategies for ${days} Days:`);
    console.log("-".repeat(50));

    const topStrategies = analyzedStrategies.slice(0, 5);
    topStrategies.forEach((strategy, i) => {
      console.log(`${i+1}. ${strategy.name}`);
      console.log(`   Chain: ${strategy.chain} | Protocol: ${strategy.protocol}`);
      console.log(`   Gross APY: ${strategy.apy.toFixed(1)}% → Net APY: ${strategy.netAPY.toFixed(1)}%`);
      console.log(`   Expected Return: ${strategy.netReturn.toFixed(0)} NECT (${days} days)`);
      console.log(`   Efficiency: ${(strategy.efficiency * 100).toFixed(0)}% | Risk: ${strategy.riskScore}/10`);
      console.log(`   Complexity: ${strategy.complexity}`);
      console.log();
    });

    // Optimal allocation
    const allocation = this.calculateOptimalAllocation(topStrategies.slice(0, 3), amount, days);
    
    return {
      days,
      topStrategies: topStrategies.slice(0, 5),
      allocation,
      averageNetAPY: allocation.expectedAPY,
      totalReturn: allocation.expectedReturn
    };
  }

  calculateOptimalAllocation(strategies, amount, days) {
    if (strategies.length === 0) return null;

    const totalScore = strategies.reduce((sum, s) => sum + s.score, 0);
    
    console.log(`🎯 OPTIMAL ALLOCATION (${days} days):`);
    console.log("-".repeat(50));
    
    let totalExpectedAPY = 0;
    let totalExpectedReturn = 0;
    const allocations = [];

    strategies.forEach(strategy => {
      const percentage = Math.round((strategy.score / totalScore) * 100);
      const allocation = (amount * percentage / 100);
      const expectedReturn = (allocation * strategy.netAPY / 100) * (days / 365);
      
      console.log(`• ${strategy.name}: ${percentage}%`);
      console.log(`  Amount: ${allocation.toLocaleString()} NECT`);
      console.log(`  Expected: ${expectedReturn.toFixed(1)} NECT return`);
      
      totalExpectedAPY += (strategy.netAPY * percentage / 100);
      totalExpectedReturn += expectedReturn;
      
      allocations.push({
        strategy: strategy.name,
        chain: strategy.chain,
        percentage,
        amount: allocation,
        expectedReturn
      });
    });

    console.log(`\n📈 Portfolio Summary:`);
    console.log(`Expected Portfolio APY: ${totalExpectedAPY.toFixed(2)}%`);
    console.log(`Total Expected Return: ${totalExpectedReturn.toFixed(1)} NECT`);
    console.log(`ROI: ${(totalExpectedReturn / amount * 100).toFixed(2)}%`);

    return {
      allocations,
      expectedAPY: totalExpectedAPY,
      expectedReturn: totalExpectedReturn,
      roi: (totalExpectedReturn / amount * 100)
    };
  }

  generateComparativeSummary(results, amount) {
    console.log(`\n\n🏆 COMPARATIVE SUMMARY`);
    console.log("=".repeat(80));
    
    // Create comparison table
    console.log(`${'Period':<20} ${'Best Strategy':<25} ${'APY':<8} ${'Return':<12} ${'ROI':<8}`);
    console.log("-".repeat(80));

    Object.entries(results).forEach(([period, data]) => {
      const periodName = this.timePeriods[period].name;
      const bestStrategy = data.topStrategies[0]?.name.substring(0, 22) || "None";
      const apy = data.averageNetAPY?.toFixed(1) + "%" || "N/A";
      const returnAmount = data.totalReturn?.toFixed(0) + " NECT" || "N/A";
      const roi = data.allocation?.roi?.toFixed(2) + "%" || "N/A";
      
      console.log(`${periodName:<20} ${bestStrategy:<25} ${apy:<8} ${returnAmount:<12} ${roi:<8}`);
    });

    // Key insights
    console.log(`\n💡 KEY INSIGHTS:`);
    console.log("-".repeat(40));
    
    const shortTerm = results.short;
    const mediumTerm = results.medium;
    const longTerm = results.long;

    console.log(`🔸 Short-term (7 days): Best for liquid, low-cost strategies`);
    if (shortTerm.topStrategies[0]) {
      console.log(`   → ${shortTerm.topStrategies[0].name} (${shortTerm.topStrategies[0].netAPY.toFixed(1)}% APY)`);
    }
    
    console.log(`🔸 Medium-term (30 days): Balanced risk/reward strategies`);
    if (mediumTerm.topStrategies[0]) {
      console.log(`   → ${mediumTerm.topStrategies[0].name} (${mediumTerm.topStrategies[0].netAPY.toFixed(1)}% APY)`);
    }
    
    console.log(`🔸 Long-term (3 months): Advanced strategies become profitable`);
    if (longTerm.topStrategies[0]) {
      console.log(`   → ${longTerm.topStrategies[0].name} (${longTerm.topStrategies[0].netAPY.toFixed(1)}% APY)`);
    }

    // Recommendations
    console.log(`\n🎯 RECOMMENDATIONS:`);
    console.log("-".repeat(40));
    console.log(`• For rentals < 14 days: Focus on Berachain native strategies`);
    console.log(`• For rentals 14-60 days: Mix of Berachain + Arbitrum simple strategies`);
    console.log(`• For rentals > 60 days: Advanced cross-chain strategies become viable`);
    console.log(`• Always consider gas costs and complexity for your user base`);
  }

  // Live data integration
  async fetchLiveRates() {
    console.log("🔄 Fetching live yield rates...");
    
    try {
      const response = await axios.get('https://yields.llama.fi/pools', { timeout: 10000 });
      const pools = response.data.data;
      
      // Update our strategies with live data
      const aavePools = pools.filter(p => p.project === 'aave-v3' && p.chain === 'Arbitrum');
      const uniswapPools = pools.filter(p => p.project === 'uniswap-v3' && p.chain === 'Arbitrum');
      
      console.log(`✅ Found ${aavePools.length} Aave pools and ${uniswapPools.length} Uniswap pools`);
      
      // Show top live opportunities
      const topLiveYields = pools
        .filter(p => p.tvlUsd > 10000000 && p.apy > 3)
        .sort((a, b) => b.apy - a.apy)
        .slice(0, 8);
        
      console.log(`\n🔥 Top Live Yields Right Now:`);
      topLiveYields.forEach((pool, i) => {
        console.log(`${i+1}. ${pool.symbol} on ${pool.project} (${pool.chain})`);
        console.log(`   APY: ${pool.apy.toFixed(2)}% | TVL: $${(pool.tvlUsd/1000000).toFixed(0)}M`);
      });
      
      return pools;
    } catch (error) {
      console.log(`⚠️  Using fallback data (${error.message})`);
      return [];
    }
  }
}

// Demo scenarios
async function runTimePeriodAnalysis() {
  const analyzer = new TimePeriodYieldAnalyzer();
  
  // Fetch live data first
  await analyzer.fetchLiveRates();
  
  console.log("\n" + "=".repeat(100));
  console.log("🎯 BERABORROW HACKATHON: TIME-BASED YIELD OPTIMIZATION");
  console.log("=".repeat(100));

  // Test different amounts and risk levels
  const testScenarios = [
    {
      name: "Conservative Portfolio",
      amount: 2500,
      risk: 4
    },
    {
      name: "Balanced Portfolio", 
      amount: 10000,
      risk: 6
    },
    {
      name: "Aggressive Portfolio",
      amount: 25000,
      risk: 8
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`\n\n${'🔍 ' + scenario.name.toUpperCase()}`);
    console.log("=".repeat(100));
    
    const results = analyzer.analyzeAllTimePeriods(scenario.amount, scenario.risk);
    
    // Wait between scenarios for readability
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

if (require.main === module) {
  runTimePeriodAnalysis().catch(console.error);
}

module.exports = { TimePeriodYieldAnalyzer }; 