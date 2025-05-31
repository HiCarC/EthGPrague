const fs = require('fs').promises;
const path = require('path');

class RiskAdjustedYieldCalculator {
    constructor() {
        this.poolDataFile = '2_pool_list.json';
        this.outputFile = '3_risk_adjusted_scores.json';
        
        // Configuration parameters (removed investmentHorizonDays)
        this.config = {
            liquidationProbability: 0.05,   // p_liq = 5% default
            baselineAPR: 3.0,               // APR_ΔSPL = 3% baseline (risk-free rate)
            emergencyHaircut: 0.4           // 40% haircut on emergency unwinding
        };
        
        console.log('📊 Risk-Adjusted Yield Calculator Initialized');
        console.log(`⚠️ Liquidation Probability: ${this.config.liquidationProbability * 100}%`);
        console.log(`📈 Baseline APR: ${this.config.baselineAPR}%`);
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
            
            const allPools = Object.values(data.pools).flat();
            console.log(`✅ Loaded ${allPools.length} pools from ${this.poolDataFile}`);
            
            return data;
        } catch (error) {
            console.error('❌ Error loading pool data:', error.message);
            throw error;
        }
    }

    /**
     * 📏 Step 2: Horizon Scaling - Calculate adjusted APR for investment horizon
     * Formula: APR_Δ = 1 - (1 + μ)^(Δ/365d)
     */
    calculateHorizonScaledAPR(annualAPR, delta) {

        if (!annualAPR || annualAPR <= 0) return 0;
        
        const μ = annualAPR / 100; // Convert percentage to decimal
        const timeRatio = delta / 365;
        
        const adjustedAPR = 1 - Math.pow(1 + μ, timeRatio);
        return adjustedAPR * 100; // Convert back to percentage
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
        return downsideVolatility * 100; // Convert back to percentage
    }

    /**
     * 💥 Step 4: Expected Loss from Emergency Unwinding
     * Formula: L_liq = p_liq × 0.4
     */
    calculateExpectedLiquidationLoss(liquidationProbability) {
        const haircut = this.config.emergencyHaircut;
        return liquidationProbability * haircut * 100; // Return as percentage
    }

    /**
     * 🔗 Step 5: Correlation Haircut
     * Formula: H_ρ = 1 - |ρ|
     */
    calculateCorrelationHaircut(correlation) {
        // For now, assume moderate correlation (0.3) for all pools
        // In a real implementation, you'd calculate correlation with a baseline portfolio
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
        const volatility = pool.volatility || 10; // Default 10% if missing
        
        // Step 2: Horizon-scaled APR
        const aprHorizon = this.calculateHorizonScaledAPR(apy, delta);
        
        // Step 3: Downside volatility
        const downsideVol = this.calculateDownsideVolatility(volatility, delta);
        
        // Step 4: Expected liquidation loss
        const liquidationLoss = this.calculateExpectedLiquidationLoss(this.config.liquidationProbability);
        
        // Step 5: Correlation haircut
        const correlationHaircut = this.calculateCorrelationHaircut(0.3); // Default correlation
        
        // Baseline APR scaled for horizon
        const baselineAPRHorizon = this.calculateHorizonScaledAPR(this.config.baselineAPR, delta);
        
        // Step 6: Final score calculation
        const numerator = aprHorizon - baselineAPRHorizon - liquidationLoss;
        const denominator = downsideVol || 1; // Avoid division by zero
        
        const score = (numerator / denominator) * correlationHaircut;
        
        return {
            score: score,
            components: {
                aprHorizon: aprHorizon,
                baselineAPRHorizon: baselineAPRHorizon,
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
                ...poolData.metadata,
                processedAt: new Date().toISOString(),
                calculationConfig: {
                    ...this.config,
                    delta: delta // Include delta in metadata
                }
            },
            scores: {}
        };

        Object.keys(poolData.pools).forEach(token => {
            const pools = poolData.pools[token];
            
            processedData.scores[token] = pools.map(pool => {
                const calculation = this.calculateRiskAdjustedScore(pool, delta);
                
                return {
                    ...pool,
                    riskAdjustedScore: calculation.score,
                    scoreComponents: calculation.components
                };
            }).sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore); // Sort by best score
        });

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
            
            const totalPools = Object.values(data.scores).flat().length;
            console.log(`📊 Total pools scored: ${totalPools}`);
        } catch (error) {
            console.error('❌ Error saving results:', error.message);
            throw error;
        }
    }

    /**
     * 📋 Step 9: Display top pools by risk-adjusted score
     */
    displayTopPools(data, delta, topN = 5) {
        console.log('\n' + '='.repeat(80));
        console.log(`🏆 TOP RISK-ADJUSTED POOLS (Δ = ${delta} days)`);
        console.log('='.repeat(80));

        Object.keys(data.scores).forEach(token => {
            const pools = data.scores[token];
            const emoji = token === 'BTC' ? '₿' : token === 'AAVE' ? '🏦' : '💎';
            
            console.log(`\n${emoji} TOP ${token} POOLS:`);
            console.log('-'.repeat(50));
            
            if (pools.length === 0) {
                console.log('❌ No pools found');
                return;
            }

            const topPools = pools.slice(0, topN);
            topPools.forEach((pool, index) => {
                console.log(`${index + 1}. ${pool.symbol}`);
                console.log(`   🎯 Risk-Adjusted Score: ${pool.riskAdjustedScore.toFixed(4)}`);
                console.log(`   📊 APY: ${pool.apy?.toFixed(2) || 'N/A'}%`);
                console.log(`   ⚡ Volatility: ${pool.volatility?.toFixed(2) || 'N/A'}%`);
                console.log(`   📏 Horizon APR: ${pool.scoreComponents.aprHorizon.toFixed(3)}%`);
                console.log(`   📉 Downside Vol: ${pool.scoreComponents.downsideVolatility.toFixed(3)}%`);
                console.log(`   🏊 Pool ID: ${pool.poolId || 'N/A'}`);
                console.log('');
            });
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