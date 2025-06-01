const fs = require('fs').promises;
const path = require('path');

class RiskAdjustedYieldCalculator {
    constructor() {
        this.poolDataFile = '2_pool_list.json';
        this.outputFile = '4_risk_adjusted_scores.json';
        
        // Configuration parameters
        this.config = {
            liquidationProbability: 0.005, // Fixed: 2% as decimal, not 200%
            lpAPR: 0.1362,         // BeraBorrow stability pool APR
            lpVol: 0.01,           // 1% volatility
            emergencyHaircut: 0.4  // 40% haircut on emergency unwinding
        };
    }

    /**
     * 📂 Step 1: Load pool data from JSON file
     */
    async loadPoolData() {
        try {
            console.log('📂 Loading pool data from JSON file...');
            const filePath = path.resolve(this.poolDataFile);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            // Handle new JSON structure - pools is now a flat array
            const allPools = data.pools || [];
            console.log(`✅ Loaded ${allPools.length} pools from ${this.poolDataFile}`);
            
            return data;
        } catch (error) {
            console.error('❌ Error loading pool data:', error.message);
            throw error;
        }
    }

    /**
     * 📏 Step 2: Horizon Scaling - Calculate adjusted APR for investment horizon
     * Formula: APR_Δ = (1 + μ)^(Δ/365d) - 1
     */
    calculateHorizonScaledAPR(annualAPR, delta) {
        if (!annualAPR || annualAPR <= 0) return 0;
        
        const μ = annualAPR; // Already in decimal format
        const timeRatio = delta / 365;
        
        const adjustedAPR = Math.pow(1 + μ, timeRatio) - 1;
        return adjustedAPR;
    }

    /**
     * 📉 Step 3: Downside Volatility (Sortino numerator)
     * Formula: σ_Δ- = σ × sqrt(Δ/365d)
     */
    calculateDownsideVolatility(annualVolatility, delta) {
        if (!annualVolatility || annualVolatility <= 0) return 0;
        
        const σ = annualVolatility / 100; // Convert percentage to decimal
        const timeRatio = delta / 365;
        
        const downsideVolatility = σ * Math.sqrt(timeRatio);
        return downsideVolatility;
    }

    /**
     * 💥 Step 4: Expected Loss from Emergency Unwinding
     * Formula: L_liq = p_liq × 0.4
     */
    calculateExpectedLiquidationLoss(liquidationProbability) {
        const haircut = this.config.emergencyHaircut;
        return liquidationProbability * haircut;
    }

    /**
     * 🔗 Step 5: Correlation Haircut
     * Formula: H_ρ = 1 - |ρ|
     */
    calculateCorrelationHaircut(correlation) {
        const assumedCorrelation = correlation || 0.3;
        return 1 - Math.abs(assumedCorrelation);
    }

    /**
     * 🎯 Step 6: Final Risk-Adjusted Yield Score
     * Formula: S = ((APR_Δ - APR_ΔSPL - L_liq) / σ_Δ-) × H_ρ
     */
    calculateRiskAdjustedScore(pool, delta) {
        // Extract pool data
        const apy = pool.apy || 0;
        const volatility = pool.volatility || 1;
        
        // Step 2: Horizon-scaled APR for the pool
        const aprHorizon = this.calculateHorizonScaledAPR(apy, delta);
        
        // Step 3: Downside volatility for the pool
        const downsideVol = this.calculateDownsideVolatility(volatility, delta);
        
        // Step 2 & 3 for Liquidity Pool (baseline/benchmark)
        const lpAPRHorizon = this.calculateHorizonScaledAPR(this.config.lpAPR, delta);
        const lpVolHorizon = this.calculateDownsideVolatility(this.config.lpVol * 100, delta);
        
        // Step 4: Expected liquidation loss
        const liquidationLoss = this.calculateExpectedLiquidationLoss(this.config.liquidationProbability);
        
        // Step 5: Correlation haircut
        const correlationHaircut = this.calculateCorrelationHaircut(0.3);
        
        // Step 6: Final score calculation
        const numerator = aprHorizon - lpAPRHorizon - liquidationLoss;
        const denominator = downsideVol || 0.001; // Avoid division by zero
        
        const score = (numerator / denominator) * correlationHaircut;
        
        return {
            score: score,
            components: {
                aprHorizon: aprHorizon,
                lpAPRHorizon: lpAPRHorizon,
                lpVolHorizon: lpVolHorizon,
                downsideVolatility: downsideVol,
                liquidationLoss: liquidationLoss,
                correlationHaircut: correlationHaircut,
                numerator: numerator,
                delta: delta
            }
        };
    }

    /**
     * 🔄 Step 7: Process all pools and calculate scores
     */
    async processAllPools(poolData, delta) {
        console.log(`🔄 Processing all pools and calculating risk-adjusted scores for Δ = ${delta} days...`);
        
        const processedData = {
            metadata: {
                timestamp: new Date().toISOString(),
                source: poolData.source || 'Unknown',
                chain: poolData.chain || 'Unknown',
                protocol: poolData.protocol || 'Unknown',
                totalPools: poolData.totalPools || 0,
                calculationConfig: {
                    ...this.config,
                    delta: delta
                }
            },
            pools: []
        };

        // Process the flat array of pools
        const allPools = poolData.pools || [];
        
        processedData.pools = allPools.map(pool => {
            const calculation = this.calculateRiskAdjustedScore(pool, delta);
            
            return {
                ...pool,
                riskAdjustedScore: calculation.score,
                scoreComponents: calculation.components
            };
        }).sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore); // Sort by best score

        console.log('✅ All pools processed and scored');
        return processedData;
    }

    /**
     * 💾 Step 8: Save results to JSON file
     */
    async saveResults(data) {
        try {
            const filePath = path.resolve(this.outputFile);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Risk-adjusted scores saved to: ${filePath}`);
            
            const totalPools = data.pools.length;
            console.log(`📊 Total pools scored: ${totalPools}`);
        } catch (error) {
            console.error('❌ Error saving results:', error.message);
            throw error;
        }
    }

    /**
     * 📋 Step 9: Display top pools by risk-adjusted score
     */
    displayTopPools(data, delta, topN = 10) {
        console.log('\n' + '='.repeat(80));
        console.log(`🏆 TOP RISK-ADJUSTED POOLS (Δ = ${delta} days)`);
        console.log('='.repeat(80));

        const allPools = data.pools || [];
        
        if (allPools.length === 0) {
            console.log('❌ No pools found');
            return;
        }

        const topPools = allPools.slice(0, topN);
        
        topPools.forEach((pool, index) => {
            const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
            
            console.log(`${emoji} ${pool.symbol}`);
            console.log(`   🎯 Risk-Adjusted Score: ${pool.riskAdjustedScore.toFixed(4)}`);
            console.log(`   📊 APY: ${(pool.apy * 100).toFixed(2)}%`);
            console.log(`   ⚡ Volatility: ${pool.volatility.toFixed(2)}%`);
            console.log(`   📏 Horizon APR: ${(pool.scoreComponents.aprHorizon * 100).toFixed(3)}%`);
            console.log(`   📉 Downside Vol: ${(pool.scoreComponents.downsideVolatility * 100).toFixed(3)}%`);
            console.log(`   💰 TVL: $${(pool.tvlUsd / 1000000).toFixed(1)}M`);
            console.log(`   🏊 Pool ID: ${pool.poolId || 'N/A'}`);
            console.log('');
        });

        console.log('='.repeat(80));
        console.log('💡 Higher scores indicate better risk-adjusted opportunities');
        console.log(`⏰ Investment horizon: ${delta} days`);
        console.log('='.repeat(80));
    }

    /**
     * 🎯 Main execution function
     */
    async calculateRiskAdjustedYields(delta) {
        try {
            console.log('🎯 STARTING RISK-ADJUSTED YIELD CALCULATION');
            console.log(`⏰ Investment Horizon (Δ): ${delta} days`);
            console.log('='.repeat(70));

            // Step 1: Load pool data
            const poolData = await this.loadPoolData();

            // Step 2-6: Process all pools and calculate scores
            const scoredData = await this.processAllPools(poolData, delta);

            // Step 7: Save results
            await this.saveResults(scoredData);

            // Step 8: Display top pools
            this.displayTopPools(scoredData, delta);

            console.log('\n✅ RISK-ADJUSTED YIELD CALCULATION COMPLETE!');
            console.log(`💾 Results saved to: ${this.outputFile}`);

            return scoredData;

        } catch (error) {
            console.error('❌ Calculation failed:', error.message);
            throw error;
        }
    }
}

// 🚀 Main execution function
async function main() {
    console.log('📊 RISK-ADJUSTED YIELD CALCULATOR');
    console.log('🎯 Processing Arbitrum Uniswap V3 Pools');
    console.log('📈 Calculating Risk-Adjusted Scores');
    console.log('');

    const delta = 7;
    console.log(`⏰ Investment Horizon: ${delta} days`);

    const calculator = new RiskAdjustedYieldCalculator();
    
    try {
        await calculator.calculateRiskAdjustedYields(delta);
    } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { RiskAdjustedYieldCalculator };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 