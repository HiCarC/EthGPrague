const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class BerachainPoolAnalyzer {
    constructor() {
        this.yieldsURL = 'https://yields.llama.fi';
        this.coinsURL = 'https://coins.llama.fi';
        this.protocols = 'https://api.llama.fi/protocols';
        
        // Target tokens for Berachain analysis
        this.targetTokens = {
            BTC: ['btc', 'wbtc', 'bitcoin'],
            ETH: ['eth', 'weth', 'ethereum'],
            AAVE: ['aave'],
            BERA: ['bera', 'berachain'], // Native Berachain token
            HONEY: ['honey', 'hny'],      // Berachain ecosystem token
            USDC: ['usdc', 'usd-coin'],   // Stablecoin
            NECT: ['nect']                // Beraborrow debt token
        };
        
        console.log('🐻 Berachain Pool List Generator Initialized');
        console.log('🎯 Target Tokens: BTC, ETH, AAVE, BERA, HONEY, USDC, NECT');
        console.log('🔗 Chain: Berachain Only');
        console.log('🦄 Protocols: BEX, Uniswap V3, and others');
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
     * 🐻 Filter for Berachain pools only
     */
    filterBerachainPools(pools) {
        console.log('🐻 Filtering Berachain pools...');
        
        const berachainPools = pools.filter(pool => {
            const chain = pool.chain?.toLowerCase() || '';
            return chain.includes('berachain') || 
                   chain.includes('bera') ||
                   chain === 'berachain-testnet' ||
                   chain === 'berachain-bartio' ||
                   chain === 'bartio';
        });

        console.log(`🐻 Found ${berachainPools.length} Berachain pools`);
        return berachainPools;
    }

    /**
     * 🦄 Filter for relevant DEX protocols on Berachain
     */
    filterDEXPools(pools) {
        console.log('🦄 Filtering DEX pools (BEX, Uniswap, etc.)...');
        
        const dexPools = pools.filter(pool => {
            const project = pool.project?.toLowerCase() || '';
            return project.includes('bex') ||          // Berachain native DEX
                   project.includes('uniswap') ||      // Uniswap on Berachain
                   project.includes('pancakeswap') ||  // PancakeSwap on Berachain
                   project.includes('sushiswap') ||    // SushiSwap on Berachain
                   project.includes('curve') ||        // Curve on Berachain
                   project.includes('balancer') ||     // Balancer on Berachain
                   project.includes('dex') ||          // General DEX
                   project.includes('swap');           // Any swap protocol
        });

        console.log(`🦄 Found ${dexPools.length} DEX pools`);
        return dexPools;
    }

    /**
     * 🎯 Find pools containing target tokens on Berachain
     */
    findTargetTokenPools(pools) {
        console.log('🎯 Searching for target token pools on Berachain...');
        
        const tokenPools = {
            BTC: [],
            ETH: [],
            AAVE: [],
            BERA: [],
            HONEY: [],
            USDC: [],
            NECT: []
        };

        pools.forEach(pool => {
            const symbol = pool.symbol?.toLowerCase() || '';
            const underlying = pool.underlying || [];
            const poolName = pool.pool?.toLowerCase() || '';
            
            // Check each target token
            Object.keys(this.targetTokens).forEach(tokenKey => {
                if (this.targetTokens[tokenKey].some(token => 
                    symbol.includes(token) || 
                    poolName.includes(token) ||
                    underlying.some(u => u.toLowerCase().includes(token))
                )) {
                    tokenPools[tokenKey].push(pool);
                }
            });
        });

        console.log(`₿ BTC pools found: ${tokenPools.BTC.length}`);
        console.log(`💎 ETH pools found: ${tokenPools.ETH.length}`);
        console.log(`🏦 AAVE pools found: ${tokenPools.AAVE.length}`);
        console.log(`🐻 BERA pools found: ${tokenPools.BERA.length}`);
        console.log(`🍯 HONEY pools found: ${tokenPools.HONEY.length}`);
        console.log(`💵 USDC pools found: ${tokenPools.USDC.length}`);
        console.log(`💰 NECT pools found: ${tokenPools.NECT.length}`);

        return tokenPools;
    }

    /**
     * 📊 Process pools to extract only required data - ONLY pools with real volatility
     */
    processPoolData(tokenPools) {
        const processedData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                chain: 'Berachain',
                protocols: 'BEX, Uniswap V3, and others',
                targetTokens: ['BTC', 'ETH', 'AAVE', 'BERA', 'HONEY', 'USDC', 'NECT']
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
                    console.log(`📊 Debug Berachain pool ${pool.symbol}:`, Object.keys(pool));
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
                            // Handle categorical risk values
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
                        apy: apy, // Stored as decimal (0.1 instead of 10%)
                        volatility: volatility,
                        volatilitySource: volatilitySource,
                        poolId: poolId,
                        project: pool.project || 'Unknown',
                        chain: pool.chain || 'Berachain',
                        tvlUsd: pool.tvlUsd || 0,
                        volumeUsd7d: pool.volumeUsd7d || 0,
                        // Include raw data for debugging
                        rawData: {
                            originalAPY: pool.apy, // Keep original percentage for reference
                            il7d: pool.il7d,
                            ilRisk: pool.ilRisk,
                            volatility: pool.volatility,
                            il30d: pool.il30d,
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
    async saveToJsonFile(data, filename = 'list_bera.json') {
        try {
            const filePath = path.resolve(filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Berachain pool data saved to: ${filePath}`);
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
        console.log('📋 BERACHAIN POOLS SUMMARY (WITH REAL VOLATILITY ONLY)');
        console.log('='.repeat(80));

        let totalPoolsWithVolatility = 0;

        Object.keys(data.pools).forEach(token => {
            const pools = data.pools[token];
            const emoji = {
                'BTC': '₿',
                'ETH': '💎',
                'AAVE': '🏦',
                'BERA': '🐻',
                'HONEY': '🍯',
                'USDC': '💵',
                'NECT': '💰'
            }[token] || '🪙';
            
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
                
                // Show protocol breakdown
                const protocols = {};
                pools.forEach(p => {
                    const protocol = p.project || 'unknown';
                    protocols[protocol] = (protocols[protocol] || 0) + 1;
                });
                console.log(`   🦄 Protocols:`, protocols);
                
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

        console.log(`\n📊 Total Berachain pools with real volatility data: ${totalPoolsWithVolatility}`);
        console.log('\n' + '='.repeat(80));
        console.log('✅ Data saved to JSON file: list_bera.json');
        console.log('💡 Only pools with actual volatility data are included');
        console.log('💡 APY stored as decimal format (0.1 = 10%)');
        console.log('🐻 Ready for Berachain DeFi strategy implementation!');
        console.log('='.repeat(80));
    }

    /**
     * 🎯 Main execution function
     */
    async getBerachainPoolsList() {
        try {
            console.log('🎯 GENERATING BERACHAIN POOL LIST');
            console.log('='.repeat(70));

            // Step 1: Get all pools
            const allPools = await this.getAllPools();
            if (allPools.length === 0) {
                throw new Error('No pools data available');
            }

            // Step 2: Filter for Berachain only
            const berachainPools = this.filterBerachainPools(allPools);
            if (berachainPools.length === 0) {
                console.log('❌ No Berachain pools found');
                const emptyData = {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        chain: 'Berachain',
                        protocols: 'BEX, Uniswap V3, and others',
                        targetTokens: ['BTC', 'ETH', 'AAVE', 'BERA', 'HONEY', 'USDC', 'NECT']
                    },
                    pools: { BTC: [], ETH: [], AAVE: [], BERA: [], HONEY: [], USDC: [], NECT: [] }
                };
                await this.saveToJsonFile(emptyData);
                return emptyData;
            }

            // Step 3: Filter for DEX protocols
            const dexPools = this.filterDEXPools(berachainPools);
            if (dexPools.length === 0) {
                console.log('❌ No DEX pools found on Berachain');
                const emptyData = {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        chain: 'Berachain',
                        protocols: 'BEX, Uniswap V3, and others',
                        targetTokens: ['BTC', 'ETH', 'AAVE', 'BERA', 'HONEY', 'USDC', 'NECT']
                    },
                    pools: { BTC: [], ETH: [], AAVE: [], BERA: [], HONEY: [], USDC: [], NECT: [] }
                };
                await this.saveToJsonFile(emptyData);
                return emptyData;
            }

            // Step 4: Find target token pools
            const targetTokenPools = this.findTargetTokenPools(dexPools);

            // Step 5: Process pool data
            const processedData = this.processPoolData(targetTokenPools);

            // Step 6: Save to JSON file
            await this.saveToJsonFile(processedData);

            // Step 7: Display summary
            this.displaySummary(processedData);

            console.log('\n✅ BERACHAIN POOL LIST COMPLETE!');

            return processedData;

        } catch (error) {
            console.error('❌ Berachain pool list generation failed:', error.message);
            console.error('🔧 Try checking your internet connection or API availability');
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    console.log('📋 BERACHAIN POOL LIST GENERATOR');
    console.log('🐻 Listing Available Pools on Berachain');
    console.log('🎯 Target Tokens: BTC, ETH, AAVE, BERA, HONEY, USDC, NECT');
    console.log('🦄 Protocols: BEX, Uniswap V3, and others');
    console.log('📡 Using DeFiLlama API');
    console.log('💾 Output: list_bera.json');
    console.log('');

    const analyzer = new BerachainPoolAnalyzer();
    
    try {
        await analyzer.getBerachainPoolsList();
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { BerachainPoolAnalyzer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 