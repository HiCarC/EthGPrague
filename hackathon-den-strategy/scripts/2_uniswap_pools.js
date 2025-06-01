const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class UniswapPoolsFetcher {
    constructor() {
        this.outputFile = '2_uniswap_pools.json';
        this.uniswapApiUrl = 'https://api.uniswap.org/v1/graphql';
        this.coingeckoApiUrl = 'https://api.coingecko.com/api/v3';
        
        // Target tokens on Arbitrum
        this.targetTokens = {
            BTC: [
                { symbol: 'WBTC', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f' },
                { symbol: 'TBTC', address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40' },
                { symbol: 'CBBTC', address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b' }
            ],
            ETH: [
                { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' },
                { symbol: 'WSTETH', address: '0x5979D7b546E38E414F7E9822514be443A4800529' },
                { symbol: 'RETH', address: '0xEC70Dcb4A1EFa46b40cB5B644fcd2b52D8EB6dCe' }
            ],
            AAVE: [
                { symbol: 'AAVE', address: '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196' }
            ]
        };
        
        // Common base tokens for pairing
        this.baseTokens = [
            { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' },
            { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
            { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
            { symbol: 'USDC.E', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' },
            { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' }
        ];
    }

    /**
     * 📡 Fetch pools from Uniswap Labs API
     */
    async fetchUniswapPools() {
        console.log('📡 Fetching pools from Uniswap Labs API...');
        
        try {
            const query = `
                query GetPools {
                    v3Pools(
                        chain: ARBITRUM,
                        first: 200,
                        orderBy: totalValueLockedUSD,
                        orderDirection: desc
                    ) {
                        address
                        feeTier
                        totalValueLockedUSD
                        volume24h {
                            value
                        }
                        fees24h {
                            value
                        }
                        token0 {
                            address
                            symbol
                            name
                        }
                        token1 {
                            address
                            symbol
                            name
                        }
                        poolDayData(first: 7, orderBy: date, orderDirection: desc) {
                            date
                            volumeUSD
                            feesUSD
                            tvlUSD
                        }
                    }
                }
            `;

            const response = await axios.post(this.uniswapApiUrl, {
                query: query
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; PoolAnalyzer/1.0)'
                }
            });

            if (response.data.errors) {
                console.log('⚠️  Uniswap API returned errors:', response.data.errors);
                return [];
            }

            const pools = response.data.data?.v3Pools || [];
            console.log(`✅ Fetched ${pools.length} pools from Uniswap`);
            return pools;

        } catch (error) {
            console.error('❌ Error fetching from Uniswap API:', error.message);
            return [];
        }
    }

    /**
     * 📊 Get token volatility from CoinGecko
     */
    async getTokenVolatility(tokenSymbol) {
        try {
            // Map common token symbols to CoinGecko IDs
            const tokenMap = {
                'WBTC': 'wrapped-bitcoin',
                'TBTC': 'tbtc',
                'CBBTC': 'coinbase-wrapped-btc',
                'WETH': 'weth',
                'WSTETH': 'wrapped-steth',
                'RETH': 'rocket-pool-eth',
                'AAVE': 'aave',
                'USDC': 'usd-coin',
                'USDT': 'tether',
                'DAI': 'dai'
            };

            const coinId = tokenMap[tokenSymbol.toUpperCase()];
            if (!coinId) {
                console.log(`⚠️  No CoinGecko mapping for ${tokenSymbol}`);
                return null;
            }

            const response = await axios.get(
                `${this.coingeckoApiUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`
            );

            const prices = response.data.prices.map(p => p[1]);
            const returns = [];
            
            for (let i = 1; i < prices.length; i++) {
                returns.push(Math.log(prices[i] / prices[i-1]));
            }

            const variance = returns.reduce((sum, ret) => {
                const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                return sum + Math.pow(ret - mean, 2);
            }, 0) / (returns.length - 1);

            // Annualized volatility (daily to annual)
            const volatility = Math.sqrt(variance * 365) * 100;
            
            return volatility;

        } catch (error) {
            console.log(`⚠️  Could not fetch volatility for ${tokenSymbol}:`, error.message);
            return null;
        }
    }

    /**
     * 🔍 Filter pools for target tokens
     */
    filterRelevantPools(pools) {
        console.log('🔍 Filtering pools for target tokens...');
        
        const relevantPools = [];
        const allTargetAddresses = new Set();
        const allBaseAddresses = new Set();

        // Collect all target and base token addresses
        Object.values(this.targetTokens).flat().forEach(token => {
            allTargetAddresses.add(token.address.toLowerCase());
        });
        
        this.baseTokens.forEach(token => {
            allBaseAddresses.add(token.address.toLowerCase());
        });

        pools.forEach(pool => {
            const token0Addr = pool.token0.address.toLowerCase();
            const token1Addr = pool.token1.address.toLowerCase();
            
            // Check if pool contains at least one target token
            const hasTargetToken = allTargetAddresses.has(token0Addr) || allTargetAddresses.has(token1Addr);
            
            // Check if it's paired with a base token or another target token
            const hasValidPair = allBaseAddresses.has(token0Addr) || allBaseAddresses.has(token1Addr) ||
                               (allTargetAddresses.has(token0Addr) && allTargetAddresses.has(token1Addr));
            
            // Filter criteria
            const meetsMinimumRequirements = 
                hasTargetToken &&
                hasValidPair &&
                parseFloat(pool.totalValueLockedUSD) > 50000 && // Min $50K TVL
                pool.volume24h?.value > 1000; // Min $1K daily volume

            if (meetsMinimumRequirements) {
                relevantPools.push(pool);
            }
        });

        console.log(`✅ Found ${relevantPools.length} relevant pools`);
        return relevantPools;
    }

    /**
     * 💰 Calculate accurate APY from fees and TVL
     */
    calculateAPY(pool) {
        try {
            const fees24h = parseFloat(pool.fees24h?.value || 0);
            const tvl = parseFloat(pool.totalValueLockedUSD || 0);
            
            if (tvl === 0) return 0;
            
            // Calculate daily yield and annualize it
            const dailyYield = fees24h / tvl;
            const annualYield = dailyYield * 365;
            
            return Math.max(0, Math.min(annualYield, 2)); // Cap at 200% to avoid outliers
            
        } catch (error) {
            console.log(`⚠️  Error calculating APY for pool:`, error.message);
            return 0;
        }
    }

    /**
     * 📈 Process pools and enrich with volatility data
     */
    async processPoolsWithVolatility(pools) {
        console.log('📈 Processing pools and fetching volatility data...');
        
        const processedPools = [];
        const volatilityCache = new Map();
        
        for (const pool of pools) {
            try {
                // Calculate APY
                const apy = this.calculateAPY(pool);
                
                // Get volatility for token pair (use the more volatile token)
                let volatility = null;
                
                const token0Symbol = pool.token0.symbol;
                const token1Symbol = pool.token1.symbol;
                
                // Check cache first
                let vol0 = volatilityCache.get(token0Symbol);
                let vol1 = volatilityCache.get(token1Symbol);
                
                // Fetch if not cached
                if (vol0 === undefined) {
                    vol0 = await this.getTokenVolatility(token0Symbol);
                    volatilityCache.set(token0Symbol, vol0);
                    
                    // Rate limit for CoinGecko
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                if (vol1 === undefined) {
                    vol1 = await this.getTokenVolatility(token1Symbol);
                    volatilityCache.set(token1Symbol, vol1);
                    
                    // Rate limit for CoinGecko
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Use the higher volatility (more conservative)
                if (vol0 !== null && vol1 !== null) {
                    volatility = Math.max(vol0, vol1);
                } else if (vol0 !== null) {
                    volatility = vol0;
                } else if (vol1 !== null) {
                    volatility = vol1;
                }
                
                // Only include pools with valid volatility data
                if (volatility !== null && volatility > 0) {
                    processedPools.push({
                        symbol: `${pool.token0.symbol}-${pool.token1.symbol}`,
                        apy: apy,
                        volatility: volatility,
                        volatilitySource: "coingecko_historical",
                        poolAddress: pool.address,
                        feeTier: pool.feeTier,
                        project: "uniswap-v3",
                        rawData: {
                            originalAPY: apy * 100, // As percentage
                            fees24h: pool.fees24h?.value || 0,
                            volume24h: pool.volume24h?.value || 0,
                            tvlUsd: parseFloat(pool.totalValueLockedUSD || 0),
                            token0: pool.token0,
                            token1: pool.token1
                        }
                    });
                }
                
                console.log(`✅ Processed ${pool.token0.symbol}-${pool.token1.symbol}: APY=${(apy*100).toFixed(2)}%, Vol=${volatility?.toFixed(2)}%`);
                
            } catch (error) {
                console.log(`⚠️  Error processing pool ${pool.token0.symbol}-${pool.token1.symbol}:`, error.message);
            }
        }
        
        console.log(`📊 Successfully processed ${processedPools.length} pools with volatility data`);
        return processedPools;
    }

    /**
     * 🏷️ Categorize pools by target token type
     */
    categorizePoolsByToken(pools) {
        const categorized = {
            BTC: [],
            ETH: [],
            AAVE: []
        };

        pools.forEach(pool => {
            const symbol = pool.symbol.toUpperCase();
            
            // Check which category this pool belongs to
            if (symbol.includes('WBTC') || symbol.includes('TBTC') || symbol.includes('CBBTC')) {
                categorized.BTC.push(pool);
            } else if (symbol.includes('WETH') || symbol.includes('WSTETH') || symbol.includes('RETH')) {
                categorized.ETH.push(pool);
            } else if (symbol.includes('AAVE')) {
                categorized.AAVE.push(pool);
            }
        });

        // Sort each category by APY descending
        Object.keys(categorized).forEach(category => {
            categorized[category].sort((a, b) => b.apy - a.apy);
        });

        return categorized;
    }

    /**
     * 💾 Save results to JSON file
     */
    async saveResults(categorizedPools) {
        try {
            const totalPools = Object.values(categorizedPools).flat().length;
            
            const outputData = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    chain: "Arbitrum",
                    protocol: "Uniswap V3",
                    targetTokens: ["BTC", "ETH", "AAVE"],
                    dataSource: "uniswap-labs-api",
                    volatilitySource: "coingecko",
                    totalPools: totalPools,
                    minTVL: 50000,
                    minVolume24h: 1000
                },
                pools: categorizedPools
            };

            const filePath = path.resolve(this.outputFile);
            await fs.writeFile(filePath, JSON.stringify(outputData, null, 2), 'utf8');
            
            console.log(`💾 Results saved to: ${filePath}`);
            console.log(`📊 Total pools: ${totalPools}`);
            
            // Display summary
            Object.keys(categorizedPools).forEach(category => {
                const count = categorizedPools[category].length;
                console.log(`   ${category}: ${count} pools`);
            });

        } catch (error) {
            console.error('❌ Error saving results:', error.message);
            throw error;
        }
    }

    /**
     * 🎯 Main execution function
     */
    async fetchAndProcessPools() {
        try {
            console.log('🎯 STARTING UNISWAP POOLS FETCHER');
            console.log('🌐 Using Uniswap Labs API + CoinGecko');
            console.log('='.repeat(60));

            // Step 1: Fetch all pools from Uniswap
            const allPools = await this.fetchUniswapPools();
            
            if (allPools.length === 0) {
                throw new Error('No pools fetched from Uniswap API');
            }

            // Step 2: Filter for relevant pools
            const relevantPools = this.filterRelevantPools(allPools);
            
            if (relevantPools.length === 0) {
                throw new Error('No relevant pools found');
            }

            // Step 3: Process pools with volatility data
            const processedPools = await this.processPoolsWithVolatility(relevantPools);
            
            if (processedPools.length === 0) {
                throw new Error('No pools processed successfully');
            }

            // Step 4: Categorize by token type
            const categorizedPools = this.categorizePoolsByToken(processedPools);

            // Step 5: Save results
            await this.saveResults(categorizedPools);

            console.log('\n✅ UNISWAP POOLS FETCH COMPLETE!');
            console.log(`💾 Results saved to: ${this.outputFile}`);

            return categorizedPools;

        } catch (error) {
            console.error('❌ Execution failed:', error.message);
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    console.log('🦄 UNISWAP POOLS FETCHER');
    console.log('🎯 Fetching Real Pool Data from Uniswap Labs');
    console.log('📈 Getting Accurate Volatility from CoinGecko');
    console.log('⚡ Chain: Arbitrum');
    console.log('');

    const fetcher = new UniswapPoolsFetcher();
    
    try {
        await fetcher.fetchAndProcessPools();
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { UniswapPoolsFetcher };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 