const axios = require('axios');
const fs = require('fs');

class ArbitrumPoolFetcher {
    constructor() {
        this.outputFile = '2_pool_list.json';
        
        // Target tokens
        this.targetTokens = {
            BTC: ['bitcoin', 'btc', 'wbtc'],
            ETH: ['ethereum', 'eth', 'weth'],
            AAVE: ['aave']
        };
    }

    /**
     * 🎯 Get pools from multiple reliable sources
     */
    async getAllPools() {
        console.log('🎯 STARTING MULTI-SOURCE POOL FETCHER');
        console.log('🌐 Using CoinGecko + DeFiLlama for reliable data');
        console.log('⚡ Chain: Arbitrum');
        console.log('============================================================');

        try {
            // Method 1: Try DeFiLlama with better filtering
            const pools = await this.fetchFromDeFiLlama();
            
            if (pools.length > 0) {
                console.log(`✅ Found ${pools.length} pools from DeFiLlama`);
                return pools;
            }

            throw new Error('No pools found from any source');

        } catch (error) {
            console.error('❌ Error in getAllPools:', error.message);
            throw error;
        }
    }

    /**
     * 📊 Fetch from DeFiLlama with better filtering
     */
    async fetchFromDeFiLlama() {
        console.log('📡 Fetching from DeFiLlama API...');
        
        try {
            const response = await axios.get('https://yields.llama.fi/pools', {
                timeout: 15000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ArbitrumPoolFetcher/1.0'
                }
            });

            if (!response.data?.data) {
                throw new Error('Invalid response format from DeFiLlama');
            }

            const allPools = response.data.data;
            console.log(`📊 Total pools available: ${allPools.length}`);

            // Filter for Arbitrum Uniswap V3 pools with our target tokens
            const filteredPools = allPools.filter(pool => {
                // Basic filters
                const isArbitrum = pool.chain?.toLowerCase() === 'arbitrum';
                const isUniswapV3 = pool.project?.toLowerCase().includes('uniswap-v3');
                const hasMinTVL = pool.tvlUsd && pool.tvlUsd > 100000; // $100k minimum
                const hasAPY = pool.apy && pool.apy > 0;

                if (!isArbitrum || !isUniswapV3 || !hasMinTVL || !hasAPY) {
                    return false;
                }

                // Check if pool contains our target tokens
                const symbol = (pool.symbol || '').toLowerCase();
                
                return Object.values(this.targetTokens).some(tokenVariants => 
                    tokenVariants.some(variant => symbol.includes(variant.toLowerCase()))
                );
            });

            console.log(`🎯 Filtered to ${filteredPools.length} relevant pools`);
            
            return filteredPools;

        } catch (error) {
            console.log(`❌ DeFiLlama error: ${error.message}`);
            return [];
        }
    }

    /**
     * 🧮 Calculate volatility from price data
     */
    calculateVolatility(pool) {
        try {
            // Method 1: Use IL (Impermanent Loss) as volatility proxy
            if (pool.il7d && typeof pool.il7d === 'number') {
                // IL7d is typically given as percentage, convert to annualized volatility
                const weeklyIL = Math.abs(pool.il7d);
                const annualizedVol = weeklyIL * Math.sqrt(52); // Scale to annual
                return Math.min(Math.max(annualizedVol, 1), 200); // Cap between 1% and 200%
            }

            // Method 2: Use price change if available
            if (pool.priceUsd && pool.price7dAgo) {
                const priceChange = Math.abs((pool.priceUsd - pool.price7dAgo) / pool.price7dAgo);
                const weeklyVol = priceChange * 100;
                const annualizedVol = weeklyVol * Math.sqrt(52);
                return Math.min(Math.max(annualizedVol, 1), 200);
            }

            // Method 3: Use volume/TVL ratio as volatility proxy
            if (pool.volumeUsd7d && pool.tvlUsd) {
                const turnover = pool.volumeUsd7d / pool.tvlUsd;
                const estimatedVol = turnover * 10; // Rough approximation
                return Math.min(Math.max(estimatedVol, 1), 200);
            }

            return null; // No volatility data available

        } catch (error) {
            return null;
        }
    }

    /**
     * 🔄 Process and save pool data
     */
    async processPoolData(pools) {
        console.log('🔄 Processing pool data...');
        
        const processedPools = [];

        for (const pool of pools) {
            try {
                const volatility = this.calculateVolatility(pool);
                
                // Only include pools with volatility data
                if (volatility === null) {
                    console.log(`❌ Skipping ${pool.symbol} - no volatility data`);
                    continue;
                }

                const processedPool = {
                    symbol: pool.symbol || 'Unknown',
                    apy: (pool.apy || 0) / 100, // Convert percentage to decimal
                    volatility: volatility,
                    poolId: pool.pool || null,
                    project: pool.project || 'Unknown',
                    chain: pool.chain || 'Unknown',
                    tvlUsd: pool.tvlUsd || 0,
                    metadata: {
                        originalAPY: pool.apy,
                        il7d: pool.il7d,
                        priceUsd: pool.priceUsd,
                        price7dAgo: pool.price7dAgo,
                        volumeUsd7d: pool.volumeUsd7d
                    }
                };

                processedPools.push(processedPool);
                console.log(`✅ ${pool.symbol}: APY ${processedPool.apy.toFixed(3)}, Vol ${volatility.toFixed(1)}%`);

            } catch (error) {
                console.log(`❌ Error processing ${pool.symbol}: ${error.message}`);
            }
        }

        return processedPools;
    }

    /**
     * 💾 Save results to JSON file
     */
    async saveResults(pools) {
        const results = {
            timestamp: new Date().toISOString(),
            source: 'DeFiLlama API',
            chain: 'Arbitrum',
            protocol: 'Uniswap V3',
            totalPools: pools.length,
            pools: pools
        };

        fs.writeFileSync(this.outputFile, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to ${this.outputFile}`);
        console.log(`📊 Total pools with volatility data: ${pools.length}`);
    }

    /**
     * 🚀 Main execution function
     */
    async run() {
        try {
            const rawPools = await this.getAllPools();
            const processedPools = await this.processPoolData(rawPools);
            
            if (processedPools.length === 0) {
                throw new Error('No pools with volatility data found');
            }

            await this.saveResults(processedPools);
            
            console.log('\n🎉 SUCCESS! Pool data fetched and processed');
            console.log(`📁 Check ${this.outputFile} for results`);
            
        } catch (error) {
            console.error('❌ Execution failed:', error.message);
            process.exit(1);
        }
    }
}

// 🚀 Execute if run directly
if (require.main === module) {
    const fetcher = new ArbitrumPoolFetcher();
    fetcher.run();
}

module.exports = ArbitrumPoolFetcher; 