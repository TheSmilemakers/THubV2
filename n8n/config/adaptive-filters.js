/**
 * Adaptive Filters Configuration
 * Dynamically adjusts market scanning parameters based on market conditions
 */

module.exports = {
  /**
   * Get adaptive filters based on current market conditions
   */
  getAdaptiveFilters: (marketConditions) => {
    const { volatility, volume, trend, timeOfDay } = marketConditions;
    
    // Base configuration
    const baseFilters = {
      exchange: 'US',
      minVolume: 1000000,
      minPrice: 5,
      maxPrice: 500,
      minDailyChange: 2,
      excludeSectors: ['REIT', 'ADR'],
      limit: 30
    };
    
    // Volatility adjustments (VIX-based)
    if (volatility > 25) {
      // High volatility - be more selective
      baseFilters.minVolume = 2000000;
      baseFilters.minDailyChange = 3;
      baseFilters.limit = 50; // But scan more candidates
    } else if (volatility < 15) {
      // Low volatility - lower thresholds
      baseFilters.minDailyChange = 1.5;
      baseFilters.limit = 20;
    }
    
    // Volume-based adjustments
    if (volume < 50000000) {
      // Low market volume - reduce price cap
      baseFilters.maxPrice = 200;
    }
    
    // Trend-based sector focus
    if (trend === 'risk-on') {
      baseFilters.prioritySectors = ['Technology', 'Consumer Discretionary', 'Communication Services'];
    } else if (trend === 'risk-off') {
      baseFilters.prioritySectors = ['Utilities', 'Consumer Staples', 'Health Care'];
    }
    
    // Time-based adjustments
    const timeAdjustments = {
      preMarket: {
        minDailyChange: 5,     // Higher threshold for gaps
        minVolume: 500000,     // Lower volume acceptable
        focusOnGaps: true,
        limit: 20
      },
      openingBell: {
        minDailyChange: 3,
        minVolume: 1500000,
        limit: 40              // More candidates during opening volatility
      },
      midday: {
        minDailyChange: 2,
        minVolume: 1000000,
        limit: 25              // Standard scanning
      },
      powerHour: {
        minDailyChange: 2.5,
        minVolume: 1500000,
        focusOnMomentum: true,
        limit: 35
      },
      afterHours: {
        minVolume: 100000,     // Much lower for AH
        minDailyChange: 3,
        focusOnNews: true,
        limit: 15
      }
    };
    
    // Apply time-based overrides
    if (timeOfDay && timeAdjustments[timeOfDay]) {
      Object.assign(baseFilters, timeAdjustments[timeOfDay]);
    }
    
    return baseFilters;
  },
  
  /**
   * Calculate opportunity score with adaptive weights
   */
  calculateAdaptiveScore: (symbol, marketConditions) => {
    let weights = {
      volume: 30,
      momentum: 40,
      liquidity: 30
    };
    
    // Adjust weights based on market conditions
    if (marketConditions.volatility > 25) {
      // In high volatility, liquidity matters more
      weights.volume = 25;
      weights.momentum = 35;
      weights.liquidity = 40;
    } else if (marketConditions.trend === 'trending') {
      // In trending markets, momentum matters more
      weights.volume = 25;
      weights.momentum = 50;
      weights.liquidity = 25;
    }
    
    // Calculate component scores
    const volumeScore = Math.min((symbol.volumeRatio || 1) * 10, weights.volume);
    const momentumScore = Math.min(Math.abs(symbol.changePercent) * 4, weights.momentum);
    const liquidityScore = Math.min(symbol.dollarVolume / 1000000, weights.liquidity);
    
    return Math.round(volumeScore + momentumScore + liquidityScore);
  },
  
  /**
   * Quality control thresholds
   */
  qualityChecks: {
    maxDailyChange: 100,        // Flag anything over 100%
    minVolume: 10000,           // Absolute minimum liquidity
    minPrice: 1,                // Penny stock threshold
    suspiciousVolumeRatio: 50,  // Volume 50x normal is suspicious
    requiredDataFields: ['symbol', 'price', 'volume', 'change']
  },
  
  /**
   * Performance targets
   */
  performanceTargets: {
    scanTime: 240000,           // 4 minutes max
    candidatesPerScan: {
      min: 20,
      max: 50
    },
    signalsPerRun: {
      min: 3,
      target: 5
    },
    errorRate: 5,               // 5% max
    apiUsagePercent: 80         // Stay under 80% of limits
  }
};