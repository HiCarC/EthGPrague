const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class BeraBorrowStabilityPoolAnalyzer {
    constructor() {
        this.yieldsURL = 'https://yields.llama.fi';
        this.coinsURL = 'https://coins.llama.fi';
        this.protocols = 'https://api.llama.fi/protocols';
        
        console.log('🐻 BeraBorrow Stability Pool Analyzer Initialized');
        console.log('🏦 Protocol: BeraBorrow');
        console.log('💰 Focus: Stability Pools');
        console.log('🔗 Chain: Berachain');
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
            return chain.includes('berachain') || chain.includes('bera');
        });

        console.log(`🐻 Found ${berachainPools.length} Berachain pools`);
        return berachainPools;
    }

    /**
     * 🏦 Filter for BeraBorrow pools only
     */
    filterBeraBorrowPools(pools) {
        console.log('🏦 Filtering BeraBorrow pools...');
        
        const beraBorrowPools = pools.filter(pool => {
            const project = pool.project?.toLowerCase() || '';
            const symbol = pool.symbol?.toLowerCase() || '';
            const poolName = pool.pool?.toLowerCase() || '';
            
            return project.includes('beraborrow') || 
                   project.includes('bera-borrow') ||
                   project.includes('bera_borrow') ||
                   symbol.includes('beraborrow') ||
                   poolName.includes('beraborrow') ||
                   poolName.includes('stability');
        });

        console.log(`🏦 Found ${beraBorrowPools.length} BeraBorrow pools`);
        return beraBorrowPools;
    }

    /**
     * 💰 Filter for Stability Pools specifically
     */
    filterStabilityPools(pools) {
        console.log('💰 Filtering Stability Pools...');
        
        const stabilityPools = pools.filter(pool => {
            const symbol = pool.symbol?.toLowerCase() || '';
            const poolName = pool.pool?.toLowerCase() || '';
            const project = pool.project?.toLowerCase() || '';
            
            // Look for stability pool indicators
            return symbol.includes('stability') ||
                   symbol.includes('stab') ||
                   symbol.includes('liquidation') ||
                   poolName.includes('stability') ||
                   poolName.includes('stab') ||
                   poolName.includes('liquidation') ||
                   // Common stability pool tokens
                   symbol.includes('nect') ||
                   symbol.includes('honey') ||
                   symbol.includes('usdc') ||
                   symbol.includes('usdt') ||
                   // BeraBorrow specific
                   (project.includes('beraborrow') && 
                    (symbol.includes('honey') || symbol.includes('usdc') || symbol.includes('nect')));
        });

        console.log(`💰 Found ${stabilityPools.length} Stability Pools`);
        return stabilityPools;
    }

    /**
     * 📊 Process stability pools to extract required data
     */
    processStabilityPoolData(pools) {
        const processedData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                chain: 'Berachain',
                protocol: 'BeraBorrow',
                poolType: 'Stability Pools',
                description: 'Stability pools for liquidation rewards'
            },
            stabilityPools: []
        };

        pools.forEach((pool, index) => {
            // Debug: log first few pools to see what fields are available
            if (index < 3) {
                console.log(`📊 Debug BeraBorrow pool ${pool.symbol}:`, Object.keys(pool));
            }

            // APY - Convert from percentage to decimal (10% -> 0.1)
            const apy = pool.apy !== null && pool.apy !== undefined ? parseFloat((pool.apy / 100).toFixed(3)) : null;

            // Extract stability pool specific metrics
            let liquidationReward = null;
            let stabilityFee = null;
            let collateralRatio = null;
            
            // Try to extract additional BeraBorrow specific data
            if (pool.liquidationReward !== undefined) {
                liquidationReward = pool.liquidationReward;
            }
            if (pool.stabilityFee !== undefined) {
                stabilityFee = pool.stabilityFee;
            }
            if (pool.collateralRatio !== undefined) {
                collateralRatio = pool.collateralRatio;
            }

            // Volatility estimation for stability pools (usually lower)
            let volatility = null;
            let volatilitySource = null;

            // Check for volatility fields
            const volatilityFields = ['il7d', 'il30d', 'volatility', 'riskScore'];
            for (const field of volatilityFields) {
                if (pool[field] !== null && pool[field] !== undefined && typeof pool[field] === 'number') {
                    volatility = parseFloat(Math.abs(pool[field]).toFixed(2));
                    volatilitySource = field;
                    break;
                }
            }

            // Default volatility for stability pools (typically lower than trading pools)
            if (volatility === null) {
                const symbol = pool.symbol?.toLowerCase() || '';
                if (symbol.includes('usdc') || symbol.includes('usdt')) {
                    volatility = 2.0; // Very low for stablecoin pools
                } else if (symbol.includes('honey') || symbol.includes('nect')) {
                    volatility = 5.0; // Low for protocol stablecoins
                } else {
                    volatility = 10.0; // Default for other assets
                }
                volatilitySource = 'stability_pool_default';
            }

            const poolId = pool.pool || null;
            
            const processedPool = {
                symbol: pool.symbol || 'Unknown',
                apy: apy,
                volatility: volatility,
                volatilitySource: volatilitySource,
                poolId: poolId,
                project: pool.project || 'BeraBorrow',
                tvlUsd: pool.tvlUsd || null,
                volumeUsd7d: pool.volumeUsd7d || null,
                // Stability pool specific fields
                liquidationReward: liquidationReward,
                stabilityFee: stabilityFee,
                collateralRatio: collateralRatio,
                // Raw data for debugging
                rawData: {
                    originalAPY: pool.apy,
                    chain: pool.chain,
                    underlying: pool.underlying,
                    ...pool // Include all original fields
                }
            };

            processedData.stabilityPools.push(processedPool);
        });

        // Sort by APY (highest first)
        processedData.stabilityPools.sort((a, b) => (b.apy || 0) - (a.apy || 0));

        return processedData;
    }

    /**
     * 💾 Save stability pool data to JSON file
     */
    async saveToJsonFile(data, filename = '2_sp_stability_pools.json') {
        try {
            const filePath = path.resolve(filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Stability pool data saved to: ${filePath}`);
            console.log(`📊 Total stability pools saved: ${data.stabilityPools.length}`);
        } catch (error) {
            console.error('❌ Error saving to JSON file:', error.message);
            throw error;
        }
    }

    /**
     * 📋 Display summary of stability pools found
     */
    displaySummary(data) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 BERABORROW STABILITY POOLS SUMMARY');
        console.log('='.repeat(80));

        const pools = data.stabilityPools;
        console.log(`💰 Total Stability Pools: ${pools.length}`);

        if (pools.length > 0) {
            const validAPY = pools.filter(p => p.apy !== null);
            const validTVL = pools.filter(p => p.tvlUsd !== null);

            console.log(`📊 Pools with APY data: ${validAPY.length}`);
            console.log(`💰 Pools with TVL data: ${validTVL.length}`);

            if (validAPY.length > 0) {
                const avgAPY = validAPY.reduce((sum, p) => sum + p.apy, 0) / validAPY.length;
                const maxAPY = Math.max(...validAPY.map(p => p.apy));
                console.log(`📈 Average APY: ${(avgAPY * 100).toFixed(2)}%`);
                console.log(`🚀 Highest APY: ${(maxAPY * 100).toFixed(2)}%`);
            }

            if (validTVL.length > 0) {
                const totalTVL = validTVL.reduce((sum, p) => sum + p.tvlUsd, 0);
                console.log(`💰 Total TVL: $${(totalTVL / 1000000).toFixed(2)}M`);
            }

            // Show top 5 pools
            console.log(`\n🏆 TOP 5 STABILITY POOLS:`);
            console.log('-'.repeat(60));
            pools.slice(0, 5).forEach((pool, index) => {
                console.log(`${index + 1}. ${pool.symbol}`);
                console.log(`   📊 APY: ${pool.apy ? (pool.apy * 100).toFixed(2) + '%' : 'N/A'}`);
                console.log(`   💰 TVL: ${pool.tvlUsd ? '$' + (pool.tvlUsd / 1000000).toFixed(2) + 'M' : 'N/A'}`);
                console.log(`   ⚡ Volatility: ${pool.volatility.toFixed(2)}%`);
                console.log(`   🏊 Pool ID: ${pool.poolId || 'N/A'}`);
                console.log('');
            });

            // Volatility sources breakdown
            const volatilitySources = {};
            pools.forEach(p => {
                const source = p.volatilitySource || 'unknown';
                volatilitySources[source] = (volatilitySources[source] || 0) + 1;
            });
            console.log(`📊 Volatility sources:`, volatilitySources);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Data saved to JSON file: 2_sp_stability_pools.json');
        console.log('💡 APY stored as decimal format (0.1 = 10%)');
        console.log('🐻 BeraBorrow stability pools for liquidation rewards');
        console.log('='.repeat(80));
    }

    /**
     * 🎯 Main execution function
     */
    async getStabilityPools() {
        try {
            console.log('🎯 FETCHING BERABORROW STABILITY POOLS');
            console.log('='.repeat(70));

            // Step 1: Get all pools
            const allPools = await this.getAllPools();
            if (allPools.length === 0) {
                throw new Error('No pools data available');
            }

            // Step 2: Filter for Berachain
            const berachainPools = this.filterBerachainPools(allPools);
            
            // Step 3: Filter for BeraBorrow (try both Berachain and general pools)
            let beraBorrowPools = this.filterBeraBorrowPools(berachainPools);
            
            // If no Berachain BeraBorrow pools, try searching all pools
            if (beraBorrowPools.length === 0) {
                console.log('⚠️ No BeraBorrow pools found on Berachain, searching all chains...');
                beraBorrowPools = this.filterBeraBorrowPools(allPools);
            }

            // Step 4: Filter for Stability Pools
            const stabilityPools = this.filterStabilityPools(beraBorrowPools);

            if (stabilityPools.length === 0) {
                console.log('❌ No BeraBorrow stability pools found');
                // Save empty data
                const emptyData = {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        chain: 'Berachain',
                        protocol: 'BeraBorrow',
                        poolType: 'Stability Pools'
                    },
                    stabilityPools: []
                };
                await this.saveToJsonFile(emptyData);
                return emptyData;
            }

            // Step 5: Process stability pool data
            const processedData = this.processStabilityPoolData(stabilityPools);

            // Step 6: Save to JSON file
            await this.saveToJsonFile(processedData);

            // Step 7: Display summary
            this.displaySummary(processedData);

            console.log('\n✅ BERABORROW STABILITY POOLS ANALYSIS COMPLETE!');

            return processedData;

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            console.error('🔧 Try checking your internet connection or API availability');
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    console.log('🐻 BERABORROW STABILITY POOL FETCHER');
    console.log('🎯 Fetching Stability Pools from BeraBorrow Protocol');
    console.log('🔗 Target Chain: Berachain');
    console.log('📡 Using DeFiLlama API');
    console.log('💾 Output: 2_sp_stability_pools.json');
    console.log('');

    const analyzer = new BeraBorrowStabilityPoolAnalyzer();
    
    try {
        await analyzer.getStabilityPools();
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { BeraBorrowStabilityPoolAnalyzer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 