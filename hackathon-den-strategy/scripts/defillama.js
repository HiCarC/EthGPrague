const axios = require('axios');

class DeFiLlamaAPI {
    constructor() {
        this.yieldsURL = 'https://yields.llama.fi';
        this.coinsURL = 'https://coins.llama.fi';
    }

    /**
     * 🐻 Get NECT-related pools for your Beraborrow strategy
     */
    async getNECTPools() {
        try {
            console.log('🔍 Searching for NECT pools...');
            const response = await axios.get(`${this.yieldsURL}/pools`);
            const allPools = response.data.data;
            
            // Filter for NECT-related pools
            const nectPools = allPools.filter(pool => 
                pool.symbol.toLowerCase().includes('nect') ||
                pool.pool.toLowerCase().includes('nect') ||
                pool.project.toLowerCase().includes('beraborrow')
            );
            
            console.log(`✅ Found ${nectPools.length} NECT-related pools`);
            return nectPools;
        } catch (error) {
            console.error('❌ Error fetching NECT pools:', error.message);
            return [];
        }
    }

    /**
     * 🦄 Get Uniswap pools for your token swapping strategy
     */
    async getUniswapPools(chains = ['ethereum', 'arbitrum', 'polygon', 'base']) {
        try {
            console.log('🦄 Fetching Uniswap pools...');
            const response = await axios.get(`${this.yieldsURL}/pools`);
            const allPools = response.data.data;
            
            const uniswapPools = allPools.filter(pool => 
                pool.project.toLowerCase().includes('uniswap') &&
                chains.includes(pool.chain.toLowerCase()) &&
                pool.tvlUsd > 1000000 // Only pools with >$1M TVL
            );
            
            console.log(`✅ Found ${uniswapPools.length} Uniswap pools across chains`);
            return uniswapPools;
        } catch (error) {
            console.error('❌ Error fetching Uniswap pools:', error.message);
            return [];
        }
    }

    /**
     * ₿ Get BTC-related pools for your conversion strategy
     */
    async getBTCPools() {
        try {
            console.log('₿ Searching for BTC pools...');
            const response = await axios.get(`${this.yieldsURL}/pools`);
            const allPools = response.data.data;
            
            const btcPools = allPools.filter(pool => 
                pool.symbol.toLowerCase().includes('btc') ||
                pool.symbol.toLowerCase().includes('wbtc') ||
                pool.underlying?.some(token => 
                    token.toLowerCase().includes('btc') || 
                    token.toLowerCase().includes('wbtc')
                )
            ).filter(pool => pool.tvlUsd > 5000000); // >$5M TVL
            
            console.log(`✅ Found ${btcPools.length} BTC-related pools`);
            return btcPools;
        } catch (error) {
            console.error('❌ Error fetching BTC pools:', error.message);
            return [];
        }
    }

    /**
     * 🎯 Analyze your complete strategy: ETH → NECT → BTC → Yield
     */
    async analyzeYieldStrategy() {
        console.log('🎯 ANALYZING YOUR YIELD STRATEGY');
        console.log('='.repeat(60));
        console.log('💡 Strategy: ETH Collateral → NECT → BTC → Uniswap Yield');
        console.log('');

        const results = {
            nectPools: await this.getNECTPools(),
            uniswapPools: await this.getUniswapPools(),
            btcPools: await this.getBTCPools()
        };

        // Find best opportunities
        const topUniswapPools = results.uniswapPools
            .sort((a, b) => b.apy - a.apy)
            .slice(0, 10);

        const topBTCPools = results.btcPools
            .sort((a, b) => b.apy - a.apy)
            .slice(0, 5);

        console.log('\n🏆 TOP UNISWAP YIELD OPPORTUNITIES:');
        console.log('-'.repeat(50));
        topUniswapPools.forEach((pool, i) => {
            console.log(`${i+1}. ${pool.symbol} on ${pool.chain}`);
            console.log(`   APY: ${pool.apy.toFixed(2)}% | TVL: $${(pool.tvlUsd/1000000).toFixed(1)}M`);
            console.log(`   Project: ${pool.project} | Pool: ${pool.pool.substring(0, 10)}...`);
            console.log('');
        });

        console.log('\n₿ TOP BTC YIELD OPPORTUNITIES:');
        console.log('-'.repeat(50));
        topBTCPools.forEach((pool, i) => {
            console.log(`${i+1}. ${pool.symbol} on ${pool.chain}`);
            console.log(`   APY: ${pool.apy.toFixed(2)}% | TVL: $${(pool.tvlUsd/1000000).toFixed(1)}M`);
            console.log(`   Project: ${pool.project}`);
            console.log('');
        });

        return results;
    }

    /**
     * 🌍 Get pools for specific chains (including Worldchain if available)
     */
    async getChainSpecificPools(chainNames = ['ethereum', 'arbitrum', 'base', 'worldchain']) {
        try {
            const response = await axios.get(`${this.yieldsURL}/pools`);
            const allPools = response.data.data;
            
            const chainPools = {};
            
            chainNames.forEach(chain => {
                chainPools[chain] = allPools.filter(pool => 
                    pool.chain.toLowerCase() === chain.toLowerCase() &&
                    pool.tvlUsd > 1000000 // >$1M TVL
                ).sort((a, b) => b.apy - a.apy).slice(0, 5);
                
                console.log(`🔗 ${chain}: ${chainPools[chain].length} top pools`);
            });
            
            return chainPools;
        } catch (error) {
            console.error('❌ Error fetching chain pools:', error.message);
            return {};
        }
    }

    /**
     * 🔄 Find swap routes: NECT → Target Token
     */
    async findSwapRoutes(fromToken = 'NECT', toTokens = ['WBTC', 'ETH', 'USDC']) {
        console.log(`🔄 Finding swap routes from ${fromToken}...`);
        
        try {
            const response = await axios.get(`${this.yieldsURL}/pools`);
            const allPools = response.data.data;
            
            const swapRoutes = {};
            
            toTokens.forEach(toToken => {
                // Find pools that contain both tokens or intermediate routes
                const directPools = allPools.filter(pool => 
                    pool.symbol.toLowerCase().includes(fromToken.toLowerCase()) &&
                    pool.symbol.toLowerCase().includes(toToken.toLowerCase())
                );
                
                const fromPools = allPools.filter(pool => 
                    pool.symbol.toLowerCase().includes(fromToken.toLowerCase())
                );
                
                const toPools = allPools.filter(pool => 
                    pool.symbol.toLowerCase().includes(toToken.toLowerCase())
                );
                
                swapRoutes[toToken] = {
                    direct: directPools,
                    fromPools: fromPools.slice(0, 3),
                    toPools: toPools.slice(0, 3)
                };
                
                console.log(`  ${fromToken} → ${toToken}: ${directPools.length} direct routes`);
            });
            
            return swapRoutes;
        } catch (error) {
            console.error('❌ Error finding swap routes:', error.message);
            return {};
        }
    }
}

// 🚀 Main execution function for your strategy
async function runBeraYieldStrategy() {
    const llama = new DeFiLlamaAPI();
    
    console.log('🐻 BERABORROW YIELD STRATEGY ANALYZER');
    console.log('='.repeat(70));
    console.log('🏠 Optimizing: ETH → NECT → BTC/Others → Uniswap Yield');
    console.log('');
    
    try {
        // 1. Analyze complete strategy
        await llama.analyzeYieldStrategy();
        
        // 2. Find swap routes
        console.log('\n🔄 SWAP ROUTE ANALYSIS:');
        console.log('='.repeat(40));
        await llama.findSwapRoutes('NECT', ['WBTC', 'ETH', 'USDC']);
        
        // 3. Chain-specific analysis
        console.log('\n🌍 CHAIN-SPECIFIC OPPORTUNITIES:');
        console.log('='.repeat(40));
        await llama.getChainSpecificPools(['ethereum', 'arbitrum', 'base', 'polygon']);
        
        console.log('\n✅ STRATEGY ANALYSIS COMPLETE!');
        console.log('💡 Ready to optimize your ETH → NECT → BTC → Yield strategy');
        
    } catch (error) {
        console.error('❌ Strategy analysis failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    runBeraYieldStrategy().catch(console.error);
}

module.exports = { DeFiLlamaAPI, runBeraYieldStrategy };