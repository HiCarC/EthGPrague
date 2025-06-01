const axios = require('axios');
const fs = require('fs');

class ETHVolatilityPredictor {
    constructor() {
        this.coingeckoAPI = 'https://api.coingecko.com/api/v3';
        this.outputFile = 'eth_volatility_prediction.json';
    }

    /**
     * 📊 Fetch historical ETH price data
     */
    async fetchETHPriceData(days = 10) {
        try {
            console.log(`📡 Fetching ${days} days of ETH price data...`);
            
            const response = await axios.get(
                `${this.coingeckoAPI}/coins/ethereum/market_chart`,
                {
                    params: {
                        vs_currency: 'usd',
                        days: days,
                        interval: 'daily'
                    }
                }
            );

            const prices = response.data.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp),
                price: price
            }));

            console.log(`✅ Fetched ${prices.length} price points`);
            return prices;

        } catch (error) {
            console.error('❌ Error fetching ETH data:', error.message);
            throw error;
        }
    }

    /**
     * 📈 Calculate daily returns and volatility metrics
     */
    calculateReturns(prices) {
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
            const prevPrice = prices[i-1].price;
            const currentPrice = prices[i].price;
            const dailyReturn = Math.log(currentPrice / prevPrice);
            
            returns.push({
                date: prices[i].date,
                price: currentPrice,
                dailyReturn: dailyReturn,
                percentChange: (currentPrice - prevPrice) / prevPrice
            });
        }

        return returns;
    }

    /**
     * 📊 Calculate different volatility measures
     */
    calculateVolatilityMetrics(returns) {
        const dailyReturns = returns.map(r => r.dailyReturn);
        
        // 1. Simple historical volatility
        const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (dailyReturns.length - 1);
        const dailyVol = Math.sqrt(variance);
        const annualVol = dailyVol * Math.sqrt(365);

        // 2. Recent volatility (last 30 days)
        const recent30 = dailyReturns.slice(-30);
        const recentMean = recent30.reduce((sum, r) => sum + r, 0) / recent30.length;
        const recentVar = recent30.reduce((sum, r) => sum + Math.pow(r - recentMean, 2), 0) / (recent30.length - 1);
        const recent30Vol = Math.sqrt(recentVar) * Math.sqrt(365);

        // 3. Exponentially weighted volatility (EWMA)
        const lambda = 0.94; // Decay factor
        let ewmaVol = dailyVol; // Initialize with simple vol
        
        for (let i = 1; i < dailyReturns.length; i++) {
            ewmaVol = Math.sqrt(lambda * Math.pow(ewmaVol, 2) + (1 - lambda) * Math.pow(dailyReturns[i], 2));
        }
        const ewmaAnnualVol = ewmaVol * Math.sqrt(365);

        // 4. Volatility of volatility (vol clustering)
        const rollingVols = [];
        const windowSize = 10;
        
        for (let i = windowSize; i < dailyReturns.length; i++) {
            const window = dailyReturns.slice(i - windowSize, i);
            const windowMean = window.reduce((sum, r) => sum + r, 0) / window.length;
            const windowVar = window.reduce((sum, r) => sum + Math.pow(r - windowMean, 2), 0) / (window.length - 1);
            rollingVols.push(Math.sqrt(windowVar));
        }

        const volOfVol = this.calculateStandardDeviation(rollingVols);

        return {
            historicalVol: annualVol,
            recent30DayVol: recent30Vol,
            ewmaVol: ewmaAnnualVol,
            volatilityOfVolatility: volOfVol,
            dailyVolatility: dailyVol,
            meanReturn: mean
        };
    }

    /**
     * 🎯 Market regime detection
     */
    detectMarketRegime(returns) {
        const recent20 = returns.slice(-20);
        const recentLogReturns = recent20.map(r => r.dailyReturn);
        const recentVolatility = this.calculateStandardDeviation(recentLogReturns);
        const annualizedRecentVol = recentVolatility * Math.sqrt(365);
        
        let regime = 'NORMAL';
        let riskMultiplier = 1.0;
        
        if (annualizedRecentVol > 0.8) {
            regime = 'HIGH_VOLATILITY';
            riskMultiplier = 1.3;
        } else if (annualizedRecentVol > 0.6) {
            regime = 'ELEVATED_VOLATILITY';
            riskMultiplier = 1.1;
        } else if (annualizedRecentVol < 0.4) {
            regime = 'LOW_VOLATILITY';
            riskMultiplier = 0.9;
        }
        
        return { regime, riskMultiplier, annualizedRecentVol };
    }

    /**
     * 🔮 Predict future volatility
     */
    predictFutureVolatility(volatilityMetrics, marketRegime, targetDays = 7) {
        console.log(`🔮 PREDICTING ETH VOLATILITY FOR NEXT ${targetDays} DAYS`);
        console.log('='.repeat(60));

        // Base prediction methods
        const predictions = {
            historical: volatilityMetrics.historicalVol,
            recent30Day: volatilityMetrics.recent30DayVol,
            ewma: volatilityMetrics.ewmaVol,
            regimeAdjusted: volatilityMetrics.ewmaVol * marketRegime.riskMultiplier
        };

        // Macro event adjustments
        const macroAdjustment = this.getMacroEventAdjustment();
        predictions.macroAdjusted = predictions.regimeAdjusted * macroAdjustment;

        // Ensemble prediction (weighted average)
        const weights = {
            historical: 0.1,
            recent30Day: 0.2,
            ewma: 0.3,
            regimeAdjusted: 0.25,
            macroAdjusted: 0.15
        };

        const ensemblePrediction = Object.keys(predictions).reduce((sum, method) => {
            return sum + (predictions[method] * weights[method]);
        }, 0);

        // Time-scale adjustment for target period
        const timeScaledVol = ensemblePrediction * Math.sqrt(targetDays / 365);

        console.log('📊 VOLATILITY PREDICTIONS:');
        Object.keys(predictions).forEach(method => {
            console.log(`   ${method}: ${(predictions[method] * 100).toFixed(1)}% annual`);
        });
        console.log(`   🎯 Ensemble: ${(ensemblePrediction * 100).toFixed(1)}% annual`);
        console.log(`   ⏰ ${targetDays}-day scaled: ${(timeScaledVol * 100).toFixed(1)}%`);
        console.log('');

        return {
            predictions,
            ensemblePrediction,
            timeScaledVolatility: timeScaledVol,
            confidence: this.calculateConfidence(volatilityMetrics, marketRegime)
        };
    }

    /**
     * 🌍 Get macro event adjustments
     */
    getMacroEventAdjustment() {
        // Check for known high-impact events
        const now = new Date();
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        let adjustment = 1.0;
        
        // Weekend typically lower volatility
        if (isWeekend) adjustment *= 0.9;
        
        // Month-end rebalancing
        const dayOfMonth = now.getDate();
        if (dayOfMonth >= 28) adjustment *= 1.1;
        
        // Options expiry (typically third Friday)
        // Add more sophisticated event detection here
        
        return adjustment;
    }

    /**
     * 📊 Calculate prediction confidence
     */
    calculateConfidence(volatilityMetrics, marketRegime) {
        let confidence = 0.7; // Base confidence
        
        // Lower confidence in high volatility regimes
        if (marketRegime.regime === 'HIGH_VOLATILITY') confidence -= 0.2;
        if (marketRegime.regime === 'ELEVATED_VOLATILITY') confidence -= 0.1;
        
        // Lower confidence if vol of vol is high
        if (volatilityMetrics.volatilityOfVolatility > 0.02) confidence -= 0.1;
        
        // Higher confidence if recent and historical vol are similar
        const volDifference = Math.abs(volatilityMetrics.historicalVol - volatilityMetrics.recent30DayVol);
        if (volDifference < 0.05) confidence += 0.1;
        
        return Math.max(0.4, Math.min(0.9, confidence));
    }

    /**
     * 🎯 Calculate liquidation probability with predicted volatility
     */
    calculateLiquidationProbability(currentCR, liquidationCR, predictedVolatility, days) {
        const requiredDrop = (currentCR - liquidationCR) / currentCR;
        
        const annualVol = predictedVolatility * Math.sqrt(365);
        const drift = -0.5 * Math.pow(annualVol, 2) * (days / 365);
        const logReturn = Math.log(1 - requiredDrop) - drift;
        const zScore = logReturn / predictedVolatility;
        
        console.log(`DEBUG ${(currentCR*100).toFixed(0)}% CR:`, {
            requiredDrop: (requiredDrop * 100).toFixed(1) + '%',
            drift: drift.toFixed(6),
            logReturn: logReturn.toFixed(6),
            zScore: zScore.toFixed(3),
            predictedVol: (predictedVolatility * 100).toFixed(1) + '%'
        });
        
        const probability = this.normalCDF(zScore);
        
        return {
            probability,
            requiredDrop: requiredDrop * 100,
            zScore,
            predictedVolatility: predictedVolatility * 100
        };
    }

    /**
     * 🧮 Utility functions
     */
    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
        return Math.sqrt(variance);
    }

    normalCDF(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return 0.5 * (1.0 + sign * y);
    }

    /**
     * 💾 Save results
     */
    async saveResults(results) {
        fs.writeFileSync(this.outputFile, JSON.stringify(results, null, 2));
        console.log(`💾 Volatility prediction saved to: ${this.outputFile}`);
    }

    /**
     * 🚀 Main execution with command line arguments
     */
    async predictETHVolatility(targetDays = 7) {
        try {
            console.log('🔮 ETH VOLATILITY PREDICTOR');
            console.log('🎯 Predicting Future Price Fluctuations');
            console.log('='.repeat(50));

            // Fetch data
            const prices = await this.fetchETHPriceData(90);
            const returns = this.calculateReturns(prices);
            
            // Analyze current state
            const volatilityMetrics = this.calculateVolatilityMetrics(returns);
            const marketRegime = this.detectMarketRegime(returns);
            
            // Make prediction
            const prediction = this.predictFutureVolatility(volatilityMetrics, marketRegime, targetDays);
            
            // Calculate liquidation probabilities for different CR levels
            const crLevels = [1.1, 1.2, 1.3, 1.5, 2.0, 2.7];
            const liquidationProbs = crLevels.map(cr => ({
                collateralRatio: cr,
                ...this.calculateLiquidationProbability(cr, 1.1, prediction.timeScaledVolatility, targetDays)
            }));

            console.log('🎯 MARKET REGIME ANALYSIS:');
            console.log(`   Current Regime: ${marketRegime.regime}`);
            console.log(`   Risk Multiplier: ${marketRegime.riskMultiplier.toFixed(2)}x`);
            console.log(`   Recent Volatility: ${marketRegime.annualizedRecentVol.toFixed(1)}% annual`);
            console.log('');

            console.log('📊 LIQUIDATION PROBABILITIES (7 days):');
            liquidationProbs.forEach(lp => {
                console.log(`   ${(lp.collateralRatio * 100).toFixed(0)}% CR: ${this.displayLiquidationProbability(lp.probability)} risk`);
            });
            console.log('');

            const results = {
                timestamp: new Date().toISOString(),
                targetDays,
                volatilityMetrics,
                marketRegime,
                prediction,
                liquidationProbabilities: liquidationProbs,
                confidence: prediction.confidence
            };

            await this.saveResults(results);
            
            console.log(`✅ PREDICTION COMPLETE`);
            console.log(`🎯 Expected ${targetDays}-day ETH volatility: ${(prediction.timeScaledVolatility * 100).toFixed(1)}%`);
            console.log(`📊 Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);

            return results;

        } catch (error) {
            console.error('❌ Prediction failed:', error.message);
            throw error;
        }
    }

    // Fixed probability display
    displayLiquidationProbability(probability) {
        if (probability < 1e-10) {
            return `${probability.toExponential(2)}%`;
        } else if (probability < 0.001) {
            return `${(probability * 100).toFixed(6)}%`;
        } else {
            return `${(probability * 100).toFixed(2)}%`;
        }
    }
}

// 🚀 Main execution with command line arguments
async function main() {
    // Get target days from command line argument or default to 7
    const args = process.argv.slice(2);
    const targetDays = args[0] ? parseInt(args[0]) : 7;
    
    // Validate input
    if (isNaN(targetDays) || targetDays < 1 || targetDays > 365) {
        console.error('❌ Invalid target days. Please provide a number between 1 and 365.');
        console.log('Usage: node scripts/eth_volatility_predictor.js [days]');
        console.log('Example: node scripts/eth_volatility_predictor.js 7');
        process.exit(1);
    }

    console.log(`🎯 Analyzing ETH volatility for ${targetDays} day${targetDays > 1 ? 's' : ''}`);
    
    const predictor = new ETHVolatilityPredictor();
    const results = await predictor.predictETHVolatility(targetDays);
    
    // Return the liquidation probability for 200% CR
    const yourPosition = results.liquidationProbabilities.find(lp => lp.collateralRatio === 2.0);
    console.log('\n🎯 YOUR 200% POSITION:');
    console.log(`   Liquidation Probability: ${predictor.displayLiquidationProbability(yourPosition.probability)}`);
    console.log(`   Required ETH Drop: ${yourPosition.requiredDrop.toFixed(1)}%`);
    console.log(`   Z-Score: ${yourPosition.zScore.toFixed(2)} standard deviations`);
    
    // Also show some other useful positions
    console.log('\n📊 OTHER COMMON POSITIONS:');
    const commonPositions = [1.2, 1.5, 2.7];
    commonPositions.forEach(cr => {
        const position = results.liquidationProbabilities.find(lp => lp.collateralRatio === cr);
        if (position) {
            console.log(`   ${(cr * 100).toFixed(0)}% CR: ${predictor.displayLiquidationProbability(position.probability)} risk`);
        }
    });
    
    return yourPosition.probability;
}

// Export for use in other scripts
module.exports = { ETHVolatilityPredictor };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 