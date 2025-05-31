const axios = require('axios');

class VolatilityAnalyzer {
  constructor() {
    this.baseURL = 'https://coins.llama.fi';
    this.yieldsURL = 'https://yields.llama.fi';
    this.defipulseURL = 'https://data-api.defipulse.com';
  }

  /**
   * 📈 Fetch historical prices for volatility calculation
   */
  async fetchHistoricalPrices(tokenSymbol, days = 30) {
    try {
      console.log(`🔍 Fetching ${days}-day price history for ${tokenSymbol}...`);
      
      // Search for token first
      const searchResponse = await axios.get(`${this.baseURL}/search/${tokenSymbol}`, {
        timeout: 10000
      });
      
      if (!searchResponse.data.coins || searchResponse.data.coins.length === 0) {
        throw new Error(`Token ${tokenSymbol} not found`);
      }
      
      const tokenId = searchResponse.data.coins[0].id;
      console.log(`✅ Found token ID: ${tokenId}`);
      
      // Get historical prices
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (days * 24 * 3600);
      
      const priceResponse = await axios.get(`${this.baseURL}/chart/${tokenId}`, {
        params: {
          start: startTime,
          end: endTime,
          period: '1d' // Daily data
        },
        timeout: 15000
      });
      
      if (!priceResponse.data.prices) {
        throw new Error(`No price data available for ${tokenSymbol}`);
      }
      
      return priceResponse.data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        price: price
      }));
      
    } catch (error) {
      console.log(`⚠️  Error fetching ${tokenSymbol} data: ${error.message}`);
      return this.getMockPriceData(tokenSymbol, days);
    }
  }

  /**
   * 🏊‍♂️ NEW: Analyze specific liquidity pools volatility
   */
  async analyzeLiquidityPoolVolatility(pools, days = 30) {
    console.log(`🏊‍♂️ LIQUIDITY POOL VOLATILITY ANALYSIS`);
    console.log("=".repeat(70));
    console.log(`Analyzing ${pools.length} pools over ${days} days\n`);

    const results = [];

    for (const pool of pools) {
      try {
        console.log(`\n🔍 Analyzing ${pool.name} (${pool.tokens.join('-')})...`);
        
        // Analyze each token in the pool
        const tokenVolatilities = {};
        for (const token of pool.tokens) {
          const priceData = await this.fetchHistoricalPrices(token, days);
          const volatilityData = this.calculateVolatility(priceData, days);
          tokenVolatilities[token] = volatilityData;
          
          console.log(`  ${token}: ${volatilityData.volatility.toFixed(1)}% volatility`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Calculate pool-level volatility
        const poolVolatility = this.calculatePoolVolatility(tokenVolatilities, pool.weights || null);
        
        results.push({
          name: pool.name,
          tokens: pool.tokens,
          chain: pool.chain,
          protocol: pool.protocol,
          poolType: pool.type,
          tokenVolatilities,
          poolVolatility,
          correlationRisk: this.calculateCorrelationRisk(tokenVolatilities),
          impermanentLossRisk: this.calculateILRisk(tokenVolatilities),
          overallRiskScore: this.calculateOverallPoolRisk(poolVolatility, tokenVolatilities)
        });
        
        console.log(`✅ Pool volatility: ${poolVolatility.toFixed(1)}%`);
        
      } catch (error) {
        console.log(`❌ Failed to analyze ${pool.name}: ${error.message}`);
        results.push(this.getMockPoolVolatilityData(pool));
      }
    }

    this.displayPoolVolatilityResults(results);
    return results;
  }

  /**
   * 📊 NEW: Calculate pool-level volatility from constituent tokens
   */
  calculatePoolVolatility(tokenVolatilities, weights = null) {
    const tokens = Object.keys(tokenVolatilities);
    
    if (tokens.length === 1) {
      return tokenVolatilities[tokens[0]].volatility;
    }
    
    // If no weights provided, assume equal weighting
    const defaultWeight = 1 / tokens.length;
    
    let poolVariance = 0;
    
    // Calculate weighted portfolio variance
    tokens.forEach((token1, i) => {
      const weight1 = weights ? weights[i] : defaultWeight;
      const vol1 = tokenVolatilities[token1].volatility / 100;
      
      tokens.forEach((token2, j) => {
        const weight2 = weights ? weights[j] : defaultWeight;
        const vol2 = tokenVolatilities[token2].volatility / 100;
        
        // Assume correlation of 0.3 for different tokens, 1.0 for same token
        const correlation = i === j ? 1.0 : 0.3;
        
        poolVariance += weight1 * weight2 * vol1 * vol2 * correlation;
      });
    });
    
    return Math.sqrt(poolVariance) * 100; // Convert back to percentage
  }

  /**
   * 🔗 NEW: Calculate correlation risk between pool tokens
   */
  calculateCorrelationRisk(tokenVolatilities) {
    const tokens = Object.keys(tokenVolatilities);
    
    if (tokens.length <= 1) return 1; // No correlation risk for single asset
    
    // Simple correlation risk based on volatility similarity
    const volatilities = tokens.map(token => tokenVolatilities[token].volatility);
    const avgVol = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
    const volSpread = Math.max(...volatilities) - Math.min(...volatilities);
    
    // Higher spread = lower correlation risk
    return Math.min(10, Math.max(1, Math.round(10 - (volSpread / avgVol) * 5)));
  }

  /**
   * 💸 NEW: Calculate impermanent loss risk
   */
  calculateILRisk(tokenVolatilities) {
    const tokens = Object.keys(tokenVolatilities);
    
    if (tokens.length <= 1) return 1; // No IL risk for single asset
    
    // IL risk increases with volatility difference between tokens
    const volatilities = tokens.map(token => tokenVolatilities[token].volatility);
    const maxVol = Math.max(...volatilities);
    const minVol = Math.min(...volatilities);
    const volRatio = maxVol / minVol;
    
    // Scale to 1-10 risk score
    return Math.min(10, Math.max(1, Math.round(volRatio)));
  }

  /**
   * 🎯 NEW: Calculate overall pool risk score
   */
  calculateOverallPoolRisk(poolVolatility, tokenVolatilities) {
    const tokens = Object.keys(tokenVolatilities);
    const avgTokenRisk = tokens.reduce((sum, token) => 
      sum + tokenVolatilities[token].riskScore, 0) / tokens.length;
    
    const poolVolRisk = Math.min(10, Math.max(1, Math.round(poolVolatility / 10)));
    
    // Weighted average of pool volatility risk and average token risk
    return Math.round((poolVolRisk * 0.6) + (avgTokenRisk * 0.4));
  }

  /**
   * 🎨 NEW: Display pool volatility results
   */
  displayPoolVolatilityResults(results) {
    console.log(`\n🏊‍♂️ POOL VOLATILITY ANALYSIS RESULTS:`);
    console.log("=".repeat(80));
    
    // Sort by overall risk score (lowest risk first)
    results.sort((a, b) => a.overallRiskScore - b.overallRiskScore);
    
    results.forEach((pool, index) => {
      console.log(`\n${index + 1}. ${pool.name} (${pool.protocol} - ${pool.chain})`);
      console.log(`   Pool Type: ${pool.poolType}`);
      console.log(`   Tokens: ${pool.tokens.join(', ')}`);
      console.log(`   Pool Volatility: ${pool.poolVolatility.toFixed(1)}%`);
      console.log(`   Overall Risk Score: ${pool.overallRiskScore}/10`);
      console.log(`   Correlation Risk: ${pool.correlationRisk}/10`);
      console.log(`   IL Risk: ${pool.impermanentLossRisk}/10`);
      
      console.log(`   Token Breakdown:`);
      pool.tokens.forEach(token => {
        const tokenData = pool.tokenVolatilities[token];
        console.log(`     ${token}: ${tokenData.volatility.toFixed(1)}% vol, ${tokenData.riskScore}/10 risk`);
      });
      console.log(`   ${'─'.repeat(50)}`);
    });
    
    // Summary statistics
    const avgPoolVol = results.reduce((sum, pool) => sum + pool.poolVolatility, 0) / results.length;
    const avgRiskScore = results.reduce((sum, pool) => sum + pool.overallRiskScore, 0) / results.length;
    
    console.log(`\n📊 SUMMARY STATISTICS:`);
    console.log(`   Average Pool Volatility: ${avgPoolVol.toFixed(1)}%`);
    console.log(`   Average Risk Score: ${avgRiskScore.toFixed(1)}/10`);
    console.log(`   Lowest Risk Pool: ${results[0].name} (${results[0].overallRiskScore}/10)`);
    console.log(`   Highest Risk Pool: ${results[results.length-1].name} (${results[results.length-1].overallRiskScore}/10)`);
  }

  /**
   * 🚀 NEW: Analyze Berachain specific pools
   */
  async analyzeBerachainPools(days = 30) {
    const berachainPools = [
      {
        name: "HONEY-USDC Pool",
        tokens: ["HONEY", "USDC"],
        chain: "berachain",
        protocol: "BEX",
        type: "AMM",
        weights: [0.5, 0.5]
      },
      {
        name: "NECT-HONEY Pool", 
        tokens: ["NECT", "HONEY"],
        chain: "berachain",
        protocol: "BEX",
        type: "AMM",
        weights: [0.5, 0.5]
      },
      {
        name: "BERA-ETH Pool",
        tokens: ["BERA", "ETH"],
        chain: "berachain", 
        protocol: "BEX",
        type: "AMM",
        weights: [0.5, 0.5]
      },
      {
        name: "NECT Single Asset",
        tokens: ["NECT"],
        chain: "berachain",
        protocol: "Beraborrow",
        type: "CDP",
        weights: [1.0]
      }
    ];

    console.log(`🐻 BERACHAIN POOLS VOLATILITY ANALYSIS`);
    console.log("=".repeat(70));
    
    return await this.analyzeLiquidityPoolVolatility(berachainPools, days);
  }

  /**
   * 🌉 NEW: Analyze cross-chain arbitrage pools
   */
  async analyzeCrossChainPools(days = 30) {
    const crossChainPools = [
      {
        name: "ETH-WETH Arbitrage",
        tokens: ["ETH"],
        chain: "multi-chain",
        protocol: "LayerZero",
        type: "Arbitrage",
        weights: [1.0]
      },
      {
        name: "USDC Cross-Chain", 
        tokens: ["USDC"],
        chain: "multi-chain",
        protocol: "Circle CCTP",
        type: "Stable Bridge",
        weights: [1.0]
      },
      {
        name: "NECT-LUSD Stable Pair",
        tokens: ["NECT", "LUSD"],
        chain: "arbitrum",
        protocol: "Curve",
        type: "Stable AMM",
        weights: [0.5, 0.5]
      }
    ];

    console.log(`🌉 CROSS-CHAIN POOLS VOLATILITY ANALYSIS`);
    console.log("=".repeat(70));
    
    return await this.analyzeLiquidityPoolVolatility(crossChainPools, days);
  }

  /**
   * 📊 Calculate volatility metrics
   */
  calculateVolatility(priceData, period = 30) {
    if (priceData.length < 2) {
      return { volatility: 0, returns: [], riskScore: 1 };
    }

    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      const dailyReturn = (priceData[i].price - priceData[i-1].price) / priceData[i-1].price;
      returns.push(dailyReturn);
    }

    // Calculate mean return
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

    // Calculate variance
    const variance = returns.reduce((sum, ret) => {
      return sum + Math.pow(ret - meanReturn, 2);
    }, 0) / (returns.length - 1);

    // Annualized volatility (daily volatility * sqrt(365))
    const volatility = Math.sqrt(variance) * Math.sqrt(365);

    // Risk score based on volatility (1-10 scale)
    const riskScore = Math.min(10, Math.max(1, Math.round(volatility * 50 + 1)));

    return {
      volatility: volatility * 100, // Convert to percentage
      returns,
      meanReturn: meanReturn * 100,
      riskScore,
      period,
      dataPoints: priceData.length
    };
  }

  // Mock data helpers
  getMockPriceData(token, days) {
    console.log(`📝 Using mock price data for ${token}`);
    const prices = [];
    let price = token === 'USDC' || token === 'USDT' || token === 'NECT' ? 1 : 
                token === 'ETH' ? 2000 : 
                token === 'BTC' ? 40000 : 100;
    
    const baseVolatility = token === 'USDC' || token === 'USDT' ? 0.005 :
                          token === 'NECT' ? 0.03 :
                          token === 'ETH' ? 0.05 : 
                          token === 'HONEY' ? 0.04 :
                          token === 'BERA' ? 0.08 : 0.06;
    
    for (let i = 0; i < days; i++) {
      const randomChange = (Math.random() - 0.5) * baseVolatility * 2;
      price *= (1 + randomChange);
      
      prices.push({
        timestamp: Date.now()/1000 - (days - i) * 24 * 3600,
        date: new Date(Date.now() - (days - i) * 24 * 3600 * 1000).toISOString().split('T')[0],
        price: price
      });
    }
    
    return prices;
  }

  getMockPoolVolatilityData(pool) {
    return {
      name: pool.name,
      tokens: pool.tokens,
      chain: pool.chain,
      protocol: pool.protocol,
      poolType: pool.type,
      tokenVolatilities: pool.tokens.reduce((acc, token) => {
        acc[token] = this.getMockVolatilityData(token);
        return acc;
      }, {}),
      poolVolatility: 25,
      correlationRisk: 3,
      impermanentLossRisk: 4,
      overallRiskScore: 5
    };
  }

  getMockVolatilityData(token) {
    const mockVolatilities = {
      'ETH': { volatility: 75, riskScore: 6 },
      'BTC': { volatility: 80, riskScore: 6 },
      'USDC': { volatility: 2, riskScore: 1 },
      'USDT': { volatility: 3, riskScore: 1 },
      'NECT': { volatility: 15, riskScore: 3 },
      'HONEY': { volatility: 25, riskScore: 4 },
      'BERA': { volatility: 60, riskScore: 6 },
      'LUSD': { volatility: 8, riskScore: 2 }
    };
    
    return mockVolatilities[token] || { volatility: 50, riskScore: 5 };
  }

  // Helper functions
  extractTokenSymbol(poolSymbol) {
    if (poolSymbol.includes('-')) return poolSymbol.split('-')[0];
    if (poolSymbol.includes('/')) return poolSymbol.split('/')[0];
    return poolSymbol;
  }
}

// Updated demo function focusing on pool analysis
async function runPoolVolatilityAnalysis() {
  const analyzer = new VolatilityAnalyzer();
  
  console.log("🎯 COMPREHENSIVE POOL VOLATILITY ANALYSIS FOR BERABORROW HACKATHON");
  console.log("=".repeat(90));
  
  try {
    // 1. Analyze Berachain pools
    console.log(`\n🐻 ANALYZING BERACHAIN NATIVE POOLS...`);
    await analyzer.analyzeBerachainPools(30);
    
    // 2. Analyze cross-chain opportunities
    console.log(`\n🌉 ANALYZING CROSS-CHAIN OPPORTUNITIES...`);
    await analyzer.analyzeCrossChainPools(30);
    
    // 3. Analyze major DeFi pools for comparison
    const majorPools = [
      {
        name: "USDC-USDT Stable Pool",
        tokens: ["USDC", "USDT"],
        chain: "arbitrum",
        protocol: "Curve",
        type: "Stable AMM",
        weights: [0.5, 0.5]
      },
      {
        name: "ETH-USDC Pool",
        tokens: ["ETH", "USDC"],
        chain: "arbitrum", 
        protocol: "Uniswap V3",
        type: "Concentrated Liquidity",
        weights: [0.5, 0.5]
      },
      {
        name: "WBTC-ETH Pool",
        tokens: ["BTC", "ETH"],
        chain: "ethereum",
        protocol: "Uniswap V2", 
        type: "AMM",
        weights: [0.5, 0.5]
      }
    ];
    
    console.log(`\n📊 ANALYZING MAJOR DEFI POOLS FOR COMPARISON...`);
    await analyzer.analyzeLiquidityPoolVolatility(majorPools, 30);
    
  } catch (error) {
    console.error(`❌ Analysis error: ${error.message}`);
  }
}

if (require.main === module) {
  runPoolVolatilityAnalysis().catch(console.error);
}

module.exports = { VolatilityAnalyzer }; 