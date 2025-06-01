const fs = require('fs');

class LiquidationProbabilityCalculator {
    constructor() {
        // ETH volatility (annual) - you can get this from your pool data
        this.ethAnnualVolatility = 0.60; // 60% annual volatility for ETH
        this.liquidationThreshold = 1.10; // 110% - liquidation happens below this
    }

    /**
     * Calculate liquidation probability using Black-Scholes-Merton approach
     */
    calculateLiquidationProbability(currentCR, liquidationCR, volatility, days) {
        // Convert to log space for price movements
        const currentRatio = currentCR; // 2.0 for 200%
        const liquidationRatio = liquidationCR; // 1.1 for 110%
        
        // Required price drop percentage to reach liquidation
        const requiredDrop = (currentRatio - liquidationRatio) / currentRatio;
        
        // Time scaling
        const timeHorizon = days / 365;
        const scaledVolatility = volatility * Math.sqrt(timeHorizon);
        
        // Z-score calculation (how many standard deviations)
        const drift = -0.5 * Math.pow(volatility, 2) * timeHorizon; // Risk-neutral drift
        const logReturn = Math.log(1 - requiredDrop) - drift;
        const zScore = logReturn / scaledVolatility;
        
        // Probability using normal CDF approximation
        const probability = this.normalCDF(zScore);
        
        return {
            probability: probability,
            requiredDrop: requiredDrop,
            zScore: zScore,
            scaledVolatility: scaledVolatility,
            safetyBuffer: currentRatio - liquidationRatio
        };
    }

    /**
     * Normal cumulative distribution function approximation
     */
    normalCDF(x) {
        // Abramowitz and Stegun approximation
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return 0.5 * (1.0 + sign * y);
    }

    /**
     * Calculate probability for different scenarios
     */
    analyzePosition(currentCR, liquidationCR, days) {
        console.log('🎯 LIQUIDATION PROBABILITY ANALYSIS');
        console.log('='.repeat(50));
        console.log(`📊 Current Collateral Ratio: ${(currentCR * 100).toFixed(0)}%`);
        console.log(`⚠️  Liquidation Threshold: ${(liquidationCR * 100).toFixed(0)}%`);
        console.log(`⏰ Time Horizon: ${days} days`);
        console.log(`📈 ETH Annual Volatility: ${(this.ethAnnualVolatility * 100).toFixed(0)}%`);
        console.log('');

        // Calculate for different volatility scenarios
        const volatilities = [0.40, 0.60, 0.80]; // 40%, 60%, 80%
        const scenarios = ['Conservative', 'Base Case', 'High Vol'];

        volatilities.forEach((vol, i) => {
            const result = this.calculateLiquidationProbability(currentCR, liquidationCR, vol, days);
            
            console.log(`📋 ${scenarios[i]} (${(vol * 100).toFixed(0)}% vol):`);
            console.log(`   🎲 Liquidation Probability: ${(result.probability * 100).toFixed(2)}%`);
            console.log(`   📉 Required ETH Drop: ${(result.requiredDrop * 100).toFixed(1)}%`);
            console.log(`   📊 Z-Score: ${result.zScore.toFixed(3)}`);
            console.log(`   🛡️  Safety Buffer: ${(result.safetyBuffer * 100).toFixed(0)}%`);
            console.log('');
        });

        // Get base case result
        const baseResult = this.calculateLiquidationProbability(currentCR, liquidationCR, this.ethAnnualVolatility, days);
        
        console.log('💡 INTERPRETATION:');
        console.log(`   • Your position has ${(baseResult.probability * 100).toFixed(2)}% chance of liquidation in ${days} days`);
        console.log(`   • ETH would need to drop ${(baseResult.requiredDrop * 100).toFixed(1)}% to trigger liquidation`);
        console.log(`   • This is ${Math.abs(baseResult.zScore).toFixed(1)} standard deviations away`);
        
        if (baseResult.probability < 0.05) {
            console.log('   ✅ LOW RISK: Liquidation probability < 5%');
        } else if (baseResult.probability < 0.15) {
            console.log('   ⚠️  MODERATE RISK: Consider adding collateral');
        } else {
            console.log('   🚨 HIGH RISK: Strong recommendation to add collateral');
        }

        return baseResult.probability;
    }

    /**
     * Find optimal collateral ratio for target liquidation probability
     */
    findOptimalCR(targetProbability, liquidationCR, days, volatility) {
        console.log('\n🎯 OPTIMAL COLLATERAL RATIO FINDER');
        console.log('='.repeat(50));
        
        // Binary search for optimal CR
        let low = liquidationCR + 0.1; // 10% above liquidation
        let high = 5.0; // 500% max
        let optimal = low;

        for (let i = 0; i < 50; i++) {
            const mid = (low + high) / 2;
            const result = this.calculateLiquidationProbability(mid, liquidationCR, volatility, days);
            
            if (Math.abs(result.probability - targetProbability) < 0.001) {
                optimal = mid;
                break;
            }
            
            if (result.probability > targetProbability) {
                low = mid;
            } else {
                high = mid;
            }
            optimal = mid;
        }

        console.log(`📊 For ${(targetProbability * 100).toFixed(1)}% liquidation risk:`);
        console.log(`   🎯 Optimal Collateral Ratio: ${(optimal * 100).toFixed(0)}%`);
        console.log(`   💰 Required Collateral Increase: ${((optimal / 2.0 - 1) * 100).toFixed(1)}%`);
        
        return optimal;
    }

    // Modified liquidation calculator for edge cases
    calculateLiquidationProbabilityAtThreshold(currentCR, liquidationCR, volatility, days) {
        // When current CR = liquidation CR, any drop triggers liquidation
        const buffer = currentCR - liquidationCR; // This would be 0 for 110% vs 110%
        
        if (buffer <= 0.001) { // Essentially at the threshold
            // Calculate probability of ANY negative movement
            const timeHorizon = days / 365;
            const scaledVolatility = volatility * Math.sqrt(timeHorizon);
            
            // For very small buffers, use different approach
            const tinyBuffer = 0.001; // 0.1% tiny buffer
            const requiredDrop = tinyBuffer / currentCR;
            
            const drift = -0.5 * Math.pow(volatility, 2) * timeHorizon;
            const logReturn = Math.log(1 - requiredDrop) - drift;
            const zScore = logReturn / scaledVolatility;
            
            // Since we need ANY drop, probability is much higher
            const probability = this.normalCDF(zScore);
            
            return {
                probability: Math.max(probability, 0.45), // Minimum 45% for edge case
                requiredDrop: requiredDrop,
                zScore: zScore,
                scaledVolatility: scaledVolatility,
                safetyBuffer: buffer,
                specialCase: 'AT_THRESHOLD'
            };
        }
        
        // Normal calculation for other cases
        return this.calculateLiquidationProbability(currentCR, liquidationCR, volatility, days);
    }
}

// 🚀 Main execution
function main() {
    const calculator = new LiquidationProbabilityCalculator();
    
    // Your current position
    const currentCR = 2.0;      // 200%
    const liquidationCR = 1.1;  // 110%
    const days = 7;             // 7 days horizon

    // Analyze current position
    const liquidationProb = calculator.analyzePosition(currentCR, liquidationCR, days);
    
    // Find optimal ratios for different risk levels
    const riskLevels = [0.01, 0.05, 0.10]; // 1%, 5%, 10%
    riskLevels.forEach(risk => {
        calculator.findOptimalCR(risk, liquidationCR, days, calculator.ethAnnualVolatility);
    });

    // Save result for use in risk calculation
    const config = {
        liquidationProbability: liquidationProb,
        currentCollateralRatio: currentCR,
        liquidationThreshold: liquidationCR,
        calculatedAt: new Date().toISOString()
    };

    fs.writeFileSync('liquidation_config.json', JSON.stringify(config, null, 2));
    console.log('\n💾 Liquidation probability saved to liquidation_config.json');
    
    return liquidationProb;
}

// Export for use in other scripts
module.exports = { LiquidationProbabilityCalculator };

// Run if called directly
if (require.main === module) {
    main();
} 