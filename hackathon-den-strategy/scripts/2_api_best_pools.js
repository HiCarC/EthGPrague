const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class UniswapPoolAnalyzer {
    constructor() {
        this.yieldsURL = 'https://yields.llama.fi';
        this.coinsURL = 'https://coins.llama.fi';
        this.protocols = 'https://api.llama.fi/protocols';
        
        // Target tokens for analysis
        this.targetTokens = {
            BTC: ['btc', 'wbtc', 'bitcoin'],
            AAVE: ['aave'],
            ETH: ['eth', 'weth', 'ethereum']
        };
        
        console.log('🦄 Uniswap Pool List Generator Initialized');
        console.log('🎯 Target Tokens: BTC, AAVE, ETH');
        console.log('🔗 Chain: Arbitrum Only');
        console.log('🦄 Protocol: Uniswap V3 Only');
    }

    /**
     * 🔍 Get all available pools from DeFiLlama
     */
    async getAllPools() {
        try {
            console.log('📡 Fetching all pools from DeFiLlama...');
            const response = await axios.get(`${this.yieldsURL}/pools`);
            
            if (!response.data || !response.data.data) {
                throw new Error('Invalid response format');
            }
            
            const pools = response.data.data;
            console.log(`✅ Fetched ${pools.length} total pools`);
            return pools;
        } catch (error) {
            console.error('❌ Error fetching pools:', error.message);
            return [];
        }
    }

    /**
     * 🔗 Filter for Arbitrum pools only
     */
    filterArbitrumPools(pools) {
        console.log('🔗 Filtering Arbitrum pools...');
        
        const arbitrumPools = pools.filter(pool => {
            const chain = pool.chain?.toLowerCase() || '';
            return chain.includes('arbitrum');
        });

        console.log(`🔗 Found ${arbitrumPools.length} Arbitrum pools`);
        return arbitrumPools;
    }

    /**
     * 🦄 Filter for Uniswap V3 pools only
     */
    filterUniswapV3Pools(pools) {
        console.log('🦄 Filtering Uniswap V3 pools...');
        
        const uniswapV3Pools = pools.filter(pool => {
            const project = pool.project?.toLowerCase() || '';
            return project.includes('uniswap') && 
                   (project.includes('v3') || project.includes('uni-v3'));
        });

        console.log(`🦄 Found ${uniswapV3Pools.length} Uniswap V3 pools`);
        return uniswapV3Pools;
    }

    /**
     * 🎯 Find pools containing target tokens (BTC, AAVE, ETH) on Arbitrum Uniswap V3
     */
    findTargetTokenPools(pools) {
        console.log('🎯 Searching for BTC, AAVE, and ETH pools on Arbitrum Uniswap V3...');
        
        const tokenPools = {
            BTC: [],
            AAVE: [],
            ETH: []
        };

        pools.forEach(pool => {
            const symbol = pool.symbol?.toLowerCase() || '';
            const underlying = pool.underlying || [];
            const poolName = pool.pool?.toLowerCase() || '';
            
            // Check BTC
            if (this.targetTokens.BTC.some(token => 
                symbol.includes(token) || 
                poolName.includes(token) ||
                underlying.some(u => u.toLowerCase().includes(token))
            )) {
                tokenPools.BTC.push(pool);
            }
            
            // Check AAVE
            if (this.targetTokens.AAVE.some(token => 
                symbol.includes(token) || 
                poolName.includes(token) ||
                underlying.some(u => u.toLowerCase().includes(token))
            )) {
                tokenPools.AAVE.push(pool);
            }
            
            // Check ETH
            if (this.targetTokens.ETH.some(token => 
                symbol.includes(token) || 
                poolName.includes(token) ||
                underlying.some(u => u.toLowerCase().includes(token))
            )) {
                tokenPools.ETH.push(pool);
            }
        });

        console.log(`₿ BTC pools found: ${tokenPools.BTC.length}`);
        console.log(`🏦 AAVE pools found: ${tokenPools.AAVE.length}`);
        console.log(`💎 ETH pools found: ${tokenPools.ETH.length}`);

        return tokenPools;
    }

    /**
     * 📊 Process pools to extract only required data - ONLY pools with real volatility
     */
    processPoolData(tokenPools) {
        const processedData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                chain: 'Arbitrum',
                protocol: 'Uniswap V3',
                targetTokens: ['BTC', 'AAVE', 'ETH']
            },
            pools: {}
        };
        
        Object.keys(tokenPools).forEach(token => {
            const pools = tokenPools[token];
            
            // Filter and process pools - only keep those with real volatility data
            const poolsWithVolatility = [];
            
            pools.forEach((pool, index) => {
                // Debug: log first few pools to see what fields are available
                if (index < 2) {
                    console.log(`📊 Debug Uniswap pool ${pool.symbol}:`, Object.keys(pool));
                }
                
                // APY - Convert from percentage to decimal (10% -> 0.1)
                const apy = pool.apy !== null && pool.apy !== undefined ? parseFloat((pool.apy / 100).toFixed(3)) : null;
                
                // Volatility - only use REAL data, no defaults
                let volatility = null;
                let volatilitySource = null;
                
                // Extended list of possible volatility fields
                const volatilityFields = [
                    'il7d', 'il30d', 'il1d', 'il365d',
                    'impermanentLoss7d', 'impermanentLoss30d', 'impermanentLoss',
                    'volatility', 'volatility7d', 'volatility30d',
                    'priceVolatility', 'vol7d', 'vol30d',
                    'std7d', 'std30d', 'stdDev7d', 'stdDev30d',
                    'variance7d', 'variance30d', 'riskScore',
                    'poolVolatility', 'tradingVolatility'
                ];
                
                // Check all possible volatility fields
                for (const field of volatilityFields) {
                    if (pool[field] !== null && pool[field] !== undefined) {
                        let value = pool[field];
                         
                        // Handle different data types
                        if (typeof value === 'number' && !isNaN(value)) {
                            volatility = parseFloat(Math.abs(value).toFixed(2));
                            volatilitySource = field;
                            break;
                        } else if (typeof value === 'string') {
                            // Try to parse string numbers
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed)) {
                                volatility = parseFloat(Math.abs(parsed).toFixed(2));
                                volatilitySource = field;
                                break;
                            }
                            // Handle categorical risk values (but only specific ones, not 'yes')
                            const riskMapping = {
                                'low': 10.0, 'medium': 25.0, 'high': 50.0, 
                                'very high': 80.0, 'extreme': 120.0
                            };
                            const riskLower = value.toLowerCase();
                            if (riskMapping[riskLower]) {
                                volatility = riskMapping[riskLower];
                                volatilitySource = `${field}_categorical`;
                                break;
                            }
                        }
                    }
                }
                
                // If still no volatility, try calculating from price change if available
                if (volatility === null) {
                    const priceFields = [
                        ['priceUsd', 'price7dAgo'],
                        ['price', 'price7d'],
                        ['currentPrice', 'previousPrice']
                    ];
                    
                    for (const [current, past] of priceFields) {
                        if (pool[current] && pool[past] && 
                            typeof pool[current] === 'number' && typeof pool[past] === 'number' &&
                            pool[current] > 0 && pool[past] > 0) {
                            const priceChange = Math.abs(pool[current] - pool[past]) / pool[past];
                            volatility = parseFloat((priceChange * 100 * Math.sqrt(52)).toFixed(2)); // Annualized
                            volatilitySource = 'calculated_from_price';
                            break;
                        }
                    }
                }
                
                // Volume-based volatility estimation (only as last resort)
                if (volatility === null && pool.volumeUsd7d && pool.tvlUsd && 
                    pool.volumeUsd7d > 0 && pool.tvlUsd > 0) {
                    const dailyVolumeRatio = (pool.volumeUsd7d / 7) / pool.tvlUsd;
                    // Only use this if ratio is significant enough to be meaningful
                    if (dailyVolumeRatio > 0.01) { // At least 1% daily volume/TVL ratio
                        volatility = parseFloat(Math.min(dailyVolumeRatio * 200, 150).toFixed(2));
                        volatilitySource = 'volume_tvl_estimation';
                    }
                }
                
                // ONLY include pools that have REAL volatility data
                if (volatility !== null && volatilitySource !== null) {
                    // Ensure volatility is reasonable (between 0.5% and 300% for crypto)
                    volatility = Math.max(0.5, Math.min(300, volatility));
                    
                    const poolId = pool.pool || null;
                    
                    poolsWithVolatility.push({
                        symbol: pool.symbol || 'Unknown',
                        apy: apy, // Now stored as decimal (0.1 instead of 10%)
                        volatility: volatility,
                        volatilitySource: volatilitySource,
                        poolId: poolId,
                        project: pool.project || 'Unknown',
                        // Include raw data for debugging
                        rawData: {
                            originalAPY: pool.apy, // Keep original percentage for reference
                            il7d: pool.il7d,
                            ilRisk: pool.ilRisk,
                            volatility: pool.volatility,
                            il30d: pool.il30d,
                            volumeUsd7d: pool.volumeUsd7d,
                            tvlUsd: pool.tvlUsd,
                            priceUsd: pool.priceUsd,
                            price7dAgo: pool.price7dAgo
                        }
                    });
                } else {
                    // Log pools that were excluded due to missing volatility
                    console.log(`❌ Excluded ${pool.symbol} - no real volatility data found`);
                }
            });
            
            processedData.pools[token] = poolsWithVolatility;
        });

        return processedData;
    }

    /**
     * 💾 Save pool data to JSON file
     */
    async saveToJsonFile(data, filename = '2_pool_list.json') {
        try {
            const filePath = path.resolve(filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Pool data saved to: ${filePath}`);
            console.log(`📊 Total pools saved: ${Object.values(data.pools).flat().length}`);
        } catch (error) {
            console.error('❌ Error saving to JSON file:', error.message);
            throw error;
        }
    }

    /**
     * 📋 Display summary of pools found
     */
    displaySummary(data) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 ARBITRUM UNISWAP V3 POOLS SUMMARY (WITH REAL VOLATILITY ONLY)');
        console.log('='.repeat(80));

        let totalPoolsWithVolatility = 0;

        Object.keys(data.pools).forEach(token => {
            const pools = data.pools[token];
            const emoji = token === 'BTC' ? '₿' : token === 'AAVE' ? '🏦' : '💎';
            
            console.log(`\n${emoji} ${token}: ${pools.length} pools with real volatility data`);
            totalPoolsWithVolatility += pools.length;
            
            if (pools.length > 0) {
                const validAPY = pools.filter(p => p.apy !== null);
                
                console.log(`   📊 Pools with APY data: ${validAPY.length}`);
                console.log(`   ⚡ All pools have volatility data: ${pools.length}`);
                
                if (validAPY.length > 0) {
                    const avgAPY = validAPY.reduce((sum, p) => sum + p.apy, 0) / validAPY.length;
                    console.log(`   📈 Average APY: ${(avgAPY * 100).toFixed(2)}%`); // Convert back to % for display
                }
                
                // Show volatility sources breakdown
                const volatilitySources = {};
                pools.forEach(p => {
                    const source = p.volatilitySource || 'unknown';
                    volatilitySources[source] = (volatilitySources[source] || 0) + 1;
                });
                
                console.log(`   📊 Volatility sources:`, volatilitySources);
                
                // Show volatility range
                const volatilities = pools.map(p => p.volatility);
                const minVol = Math.min(...volatilities);
                const maxVol = Math.max(...volatilities);
                const avgVol = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
                
                console.log(`   ⚡ Volatility range: ${minVol.toFixed(2)}% - ${maxVol.toFixed(2)}% (avg: ${avgVol.toFixed(2)}%)`);
            }
        });

        console.log(`\n📊 Total pools with real volatility data: ${totalPoolsWithVolatility}`);
        console.log('\n' + '='.repeat(80));
        console.log('✅ Data saved to JSON file: 2_pool_list.json');
        console.log('💡 Only pools with actual volatility data are included');
        console.log('💡 APY stored as decimal format (0.1 = 10%)');
        console.log('='.repeat(80));
    }

    /**
     * 🎯 Main execution function
     */
    async getPoolsList() {
        try {
            console.log('🎯 GENERATING ARBITRUM UNISWAP V3 POOL LIST FOR BTC, AAVE, ETH');
            console.log('='.repeat(70));

            // Step 1: Get all pools
            const allPools = await this.getAllPools();
            if (allPools.length === 0) {
                throw new Error('No pools data available');
            }

            // Step 2: Filter for Arbitrum only
            const arbitrumPools = this.filterArbitrumPools(allPools);
            if (arbitrumPools.length === 0) {
                console.log('❌ No Arbitrum pools found');
                const emptyData = {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        chain: 'Arbitrum',
                        protocol: 'Uniswap V3',
                        targetTokens: ['BTC', 'AAVE', 'ETH']
                    },
                    pools: { BTC: [], AAVE: [], ETH: [] }
                };
                await this.saveToJsonFile(emptyData);
                return emptyData;
            }

            // Step 3: Filter for Uniswap V3 only
            const uniswapV3Pools = this.filterUniswapV3Pools(arbitrumPools);
            if (uniswapV3Pools.length === 0) {
                console.log('❌ No Uniswap V3 pools found on Arbitrum');
                const emptyData = {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        chain: 'Arbitrum',
                        protocol: 'Uniswap V3',
                        targetTokens: ['BTC', 'AAVE', 'ETH']
                    },
                    pools: { BTC: [], AAVE: [], ETH: [] }
                };
                await this.saveToJsonFile(emptyData);
                return emptyData;
            }

            // Step 4: Find target token pools
            const targetTokenPools = this.findTargetTokenPools(uniswapV3Pools);

            // Step 5: Process pool data
            const processedData = this.processPoolData(targetTokenPools);

            // Step 6: Save to JSON file
            await this.saveToJsonFile(processedData);

            // Step 7: Display summary
            this.displaySummary(processedData);

            console.log('\n✅ ARBITRUM UNISWAP V3 POOL LIST COMPLETE!');

            return processedData;

        } catch (error) {
            console.error('❌ List generation failed:', error.message);
            console.error('🔧 Try checking your internet connection or API availability');
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    console.log('📋 ARBITRUM UNISWAP V3 POOL LIST GENERATOR');
    console.log('🎯 Listing Available Pools for BTC, AAVE, and ETH');
    console.log('🔗 Chain: Arbitrum Only');
    console.log('🦄 Protocol: Uniswap V3 Only');
    console.log('📡 Using DeFiLlama API');
    console.log('💾 Output: 2_pool_list.json');
    console.log('');

    const analyzer = new UniswapPoolAnalyzer();
    
    try {
        await analyzer.getPoolsList();
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { UniswapPoolAnalyzer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 