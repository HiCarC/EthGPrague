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
        
        console.log('🦄 Pool List Generator Initialized');
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
     * 📊 Process pools to extract only required data
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
            
            processedData.pools[token] = pools.map((pool, index) => {
                // APY
                const apy = pool.apy !== null && pool.apy !== undefined ? parseFloat(pool.apy.toFixed(2)) : null;
                
                // Volatility (try different possible fields)
                let volatility = null;
                if (pool.il7d !== null && pool.il7d !== undefined) {
                    volatility = parseFloat(pool.il7d.toFixed(2));
                } else if (pool.ilRisk !== null && pool.ilRisk !== undefined) {
                    volatility = pool.ilRisk;
                } else if (pool.volatility !== null && pool.volatility !== undefined) {
                    volatility = parseFloat(pool.volatility.toFixed(2));
                }
                
                // Pool ID
                const poolId = pool.pool || null;
                
                return {
                    symbol: pool.symbol || 'Unknown',
                    apy: apy,
                    volatility: volatility,
                    poolId: poolId,
                    project: pool.project || 'Unknown'
                };
            });
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
        console.log('📋 ARBITRUM UNISWAP V3 POOLS SUMMARY');
        console.log('='.repeat(80));

        Object.keys(data.pools).forEach(token => {
            const pools = data.pools[token];
            const emoji = token === 'BTC' ? '₿' : token === 'AAVE' ? '🏦' : '💎';
            
            console.log(`\n${emoji} ${token}: ${pools.length} pools found`);
            
            if (pools.length > 0) {
                const validAPY = pools.filter(p => p.apy !== null);
                const validVolatility = pools.filter(p => p.volatility !== null);
                
                console.log(`   📊 Pools with APY data: ${validAPY.length}`);
                console.log(`   ⚡ Pools with volatility data: ${validVolatility.length}`);
                
                if (validAPY.length > 0) {
                    const avgAPY = validAPY.reduce((sum, p) => sum + p.apy, 0) / validAPY.length;
                    console.log(`   📈 Average APY: ${avgAPY.toFixed(2)}%`);
                }
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('✅ Data saved to JSON file: 2_pool_list.json');
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