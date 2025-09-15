import { EODHDService, RealTimeQuote, IntradayData, EODData } from './eodhd.service';
import { getRateLimiter } from './rate-limiter.service';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';

export interface LiquidityAnalysisResult {
  score: number;
  signals: string[];
  data: {
    spread: number;
    volumeProfile: {
      percentile: number;
      average: number;
      current: number;
    };
    marketDepth: {
      stability: number;
      volatility: number;
    };
    tradingFrequency: {
      tradesPerMinute: number;
      volumePerMinute: number;
    };
    priceImpact: number;
    dollarVolume: number;
    liquidityClass: 'high' | 'medium' | 'low';
  };
}

/**
 * Liquidity Analysis Service
 * Analyzes market microstructure to assess trading liquidity
 * Uses 1-minute data for granular spread and depth analysis
 */
export class LiquidityAnalysisService {
  private eodhd: EODHDService;
  private rateLimiter = getRateLimiter();
  private logger = logger.createChild('LiquidityAnalysis');

  constructor(eodhd?: EODHDService) {
    this.eodhd = eodhd || new EODHDService();
  }

  /**
   * Analyze liquidity using microstructure data
   * Focuses on spread, depth, volume profile, and trading frequency
   * @param symbol Stock symbol to analyze
   * @returns Liquidity score (0-100), signals, and microstructure data
   */
  async analyzeSymbol(symbol: string): Promise<LiquidityAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validate symbol
      if (!symbol || symbol.length === 0) {
        throw new ValidationError('Symbol is required');
      }

      this.logger.info(`Starting liquidity analysis for ${symbol}`);

      // Check rate limits (3 API calls needed)
      const canProceed = await this.rateLimiter.checkLimit(3);
      if (!canProceed) {
        this.logger.warn(`Rate limit would be exceeded for ${symbol}`);
        return this.getDefaultResult();
      }

      // Fetch data in parallel for efficiency
      const [quote, intradayData, historicalData] = await Promise.all([
        this.fetchRealTimeQuote(symbol),
        this.fetchIntradayData(symbol),
        this.fetchHistoricalData(symbol)
      ]);

      // Calculate liquidity score from microstructure analysis
      const result = this.calculateLiquidityScore(quote, intradayData, historicalData);
      
      const duration = Date.now() - startTime;
      this.logger.info(`Liquidity analysis completed for ${symbol} in ${duration}ms`, {
        score: result.score,
        signalCount: result.signals.length,
        liquidityClass: result.data.liquidityClass
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Liquidity analysis failed for ${symbol}:`, error);
      return this.getDefaultResult();
    }
  }

  /**
   * Fetch real-time quote
   * API Cost: 1 call
   */
  private async fetchRealTimeQuote(symbol: string): Promise<RealTimeQuote> {
    await this.rateLimiter.consume(1);
    return this.eodhd.getRealTimeQuote(symbol);
  }

  /**
   * Fetch 1-minute intraday data for microstructure analysis
   * API Cost: 1 call
   */
  private async fetchIntradayData(symbol: string): Promise<IntradayData[]> {
    await this.rateLimiter.consume(1);
    return this.eodhd.getIntradayData(symbol, '1m');
  }

  /**
   * Fetch historical data for volume profile
   * API Cost: 1 call
   */
  private async fetchHistoricalData(symbol: string): Promise<EODData[]> {
    await this.rateLimiter.consume(1);
    return this.eodhd.getHistoricalData(symbol, 20);
  }

  /**
   * Calculate liquidity score from multiple microstructure metrics
   */
  private calculateLiquidityScore(
    quote: RealTimeQuote,
    intradayData: IntradayData[],
    historicalData: EODData[]
  ): LiquidityAnalysisResult {
    let score = 50; // Base score
    const signals: string[] = [];
    
    // 1. Spread analysis (estimated from high/low if bid/ask not available)
    const estimatedSpread = this.estimateSpread(quote, intradayData);

    if (estimatedSpread < 0.05) {
      score += 20;
      signals.push(`Very tight spread (${(estimatedSpread * 100).toFixed(3)}%) - excellent liquidity`);
    } else if (estimatedSpread < 0.1) {
      score += 15;
      signals.push(`Tight spread (${(estimatedSpread * 100).toFixed(3)}%) - good liquidity`);
    } else if (estimatedSpread < 0.2) {
      score += 5;
      signals.push(`Moderate spread (${(estimatedSpread * 100).toFixed(3)}%)`);
    } else if (estimatedSpread > 0.3) {
      score -= 15;
      signals.push(`Wide spread (${(estimatedSpread * 100).toFixed(3)}%) - liquidity concern`);
    }

    // 2. Volume Profile Analysis
    const volumeProfile = this.analyzeVolumeProfile(quote.volume, historicalData);

    if (volumeProfile.percentile > 90) {
      score += 20;
      signals.push(`Exceptional volume (${volumeProfile.percentile}th percentile)`);
    } else if (volumeProfile.percentile > 70) {
      score += 10;
      signals.push(`High volume (${volumeProfile.percentile}th percentile)`);
    } else if (volumeProfile.percentile > 50) {
      score += 5;
      signals.push(`Above average volume (${volumeProfile.percentile}th percentile)`);
    } else if (volumeProfile.percentile < 30) {
      score -= 10;
      signals.push(`Below average volume (${volumeProfile.percentile}th percentile)`);
    }

    // 3. Market Depth Proxy (using intraday data)
    const depthScore = this.analyzeMarketDepth(intradayData);

    if (depthScore.stability > 0.8) {
      score += 15;
      signals.push('Stable price action - good market depth');
    } else if (depthScore.stability > 0.6) {
      score += 5;
      signals.push('Moderate price stability');
    } else if (depthScore.stability < 0.5) {
      score -= 10;
      signals.push('Erratic price action - poor market depth');
    }

    // 4. Trading Frequency
    const tradingFrequency = this.analyzeTradingFrequency(intradayData);

    if (tradingFrequency.tradesPerMinute > 10) {
      score += 10;
      signals.push(`Very active trading (${tradingFrequency.tradesPerMinute.toFixed(1)} trades/min est.)`);
    } else if (tradingFrequency.tradesPerMinute > 5) {
      score += 5;
      signals.push(`Active trading (${tradingFrequency.tradesPerMinute.toFixed(1)} trades/min est.)`);
    } else if (tradingFrequency.tradesPerMinute < 1) {
      score -= 15;
      signals.push('Low trading activity - liquidity risk');
    }

    // 5. Price Impact Analysis
    const priceImpact = this.analyzePriceImpact(intradayData);

    if (priceImpact < 0.1) {
      score += 10;
      signals.push(`Low price impact (${(priceImpact * 100).toFixed(2)}%) - excellent liquidity`);
    } else if (priceImpact < 0.3) {
      score += 5;
      signals.push(`Moderate price impact (${(priceImpact * 100).toFixed(2)}%)`);
    } else if (priceImpact > 0.5) {
      score -= 10;
      signals.push(`High price impact (${(priceImpact * 100).toFixed(2)}%) - liquidity risk`);
    }

    // 6. Dollar Volume Classification
    const dollarVolume = quote.volume * quote.close;
    let liquidityClass: 'high' | 'medium' | 'low' = 'medium';

    if (dollarVolume > 100000000) { // $100M+
      score += 15;
      signals.push(`Very high dollar volume ($${(dollarVolume / 1000000).toFixed(1)}M)`);
      liquidityClass = 'high';
    } else if (dollarVolume > 10000000) { // $10M+
      score += 10;
      signals.push(`High dollar volume ($${(dollarVolume / 1000000).toFixed(1)}M)`);
      liquidityClass = 'high';
    } else if (dollarVolume > 1000000) { // $1M+
      signals.push(`Moderate dollar volume ($${(dollarVolume / 1000000).toFixed(1)}M)`);
      liquidityClass = 'medium';
    } else { // <$1M
      score -= 20;
      signals.push(`Low dollar volume warning ($${(dollarVolume / 1000).toFixed(0)}K)`);
      liquidityClass = 'low';
    }

    // Ensure score is within bounds
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      score: finalScore,
      signals,
      data: {
        spread: estimatedSpread,
        volumeProfile,
        marketDepth: depthScore,
        tradingFrequency,
        priceImpact,
        dollarVolume,
        liquidityClass
      }
    };
  }

  /**
   * Estimate spread from recent price action
   */
  private estimateSpread(quote: RealTimeQuote, intradayData: IntradayData[]): number {
    // Use recent 1-minute candles to estimate spread
    const recentCandles = intradayData.slice(-10);
    
    if (recentCandles.length === 0) {
      // Fallback to day's range
      const dayRange = quote.high - quote.low;
      return quote.close > 0 ? dayRange / quote.close : 0.01;
    }
    
    // Calculate average spread from high-low ranges
    const spreads = recentCandles.map(candle => {
      const spread = candle.high - candle.low;
      return candle.close > 0 ? spread / candle.close : 0;
    }).filter(s => s > 0); // Filter out zero spreads
    
    if (spreads.length === 0) return 0.01; // Default 1% spread
    
    // Use median spread to reduce impact of outliers
    spreads.sort((a, b) => a - b);
    const medianIndex = Math.floor(spreads.length / 2);
    return spreads[medianIndex];
  }

  /**
   * Analyze volume profile relative to historical data
   */
  private analyzeVolumeProfile(
    currentVolume: number,
    historicalData: EODData[]
  ) {
    const volumes = historicalData.map(d => d.volume).sort((a, b) => a - b);
    
    // Find position of current volume in sorted array
    let position = 0;
    for (let i = 0; i < volumes.length; i++) {
      if (volumes[i] > currentVolume) {
        position = i;
        break;
      }
      position = i + 1;
    }
    
    const percentile = Math.round((position / volumes.length) * 100);
    const average = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    
    return {
      percentile,
      average,
      current: currentVolume
    };
  }

  /**
   * Analyze market depth using price stability metrics
   */
  private analyzeMarketDepth(intradayData: IntradayData[]) {
    const recentData = intradayData.slice(-60); // Last hour
    
    if (recentData.length < 10) {
      return { stability: 0.5, volatility: 1.0 };
    }
    
    // Calculate minute-to-minute price changes
    const priceChanges: number[] = [];
    for (let i = 1; i < recentData.length; i++) {
      if (recentData[i-1].close > 0) {
        const change = Math.abs(
          (recentData[i].close - recentData[i-1].close) / recentData[i-1].close
        );
        priceChanges.push(change);
      }
    }
    
    if (priceChanges.length === 0) {
      return { stability: 0.5, volatility: 1.0 };
    }
    
    // Calculate average change and stability
    const avgChange = priceChanges.reduce((sum, c) => sum + c, 0) / priceChanges.length;
    const stability = Math.max(0, 1 - (avgChange * 100)); // Convert to 0-1 scale
    
    return {
      stability,
      volatility: avgChange * 100 // Percentage volatility
    };
  }

  /**
   * Analyze trading frequency from volume patterns
   */
  private analyzeTradingFrequency(intradayData: IntradayData[]) {
    const recentData = intradayData.slice(-60); // Last hour
    
    if (recentData.length === 0) {
      return { tradesPerMinute: 0, volumePerMinute: 0 };
    }
    
    const totalVolume = recentData.reduce((sum, d) => sum + d.volume, 0);
    const avgVolumePerMinute = totalVolume / recentData.length;
    
    // Count minutes with significant volume (proxy for trading activity)
    const activeMinutes = recentData.filter(d => 
      d.volume > avgVolumePerMinute * 0.5
    ).length;
    
    // Estimate trades per minute based on volume patterns
    // Assume higher volume minutes have more trades
    const volumeSpikes = recentData.filter(d => 
      d.volume > avgVolumePerMinute * 1.5
    ).length;
    
    // Rough estimation: base trades + spikes contribution
    const baseTradesPerMinute = activeMinutes / recentData.length * 5;
    const spikeContribution = volumeSpikes / recentData.length * 10;
    
    return {
      tradesPerMinute: baseTradesPerMinute + spikeContribution,
      volumePerMinute: avgVolumePerMinute
    };
  }

  /**
   * Analyze price impact from volume-price relationships
   */
  private analyzePriceImpact(intradayData: IntradayData[]): number {
    const recentData = intradayData.slice(-30); // Last 30 minutes
    
    if (recentData.length < 5) return 0.5; // Default medium impact
    
    // Calculate correlation between volume spikes and price moves
    const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
    
    let totalImpact = 0;
    let impactCount = 0;
    
    for (let i = 1; i < recentData.length; i++) {
      const volumeRatio = recentData[i].volume / avgVolume;
      
      // Check high volume minutes
      if (volumeRatio > 1.5 && recentData[i-1].close > 0) {
        const priceChange = Math.abs(
          (recentData[i].close - recentData[i-1].close) / recentData[i-1].close
        );
        totalImpact += priceChange;
        impactCount++;
      }
    }
    
    // Average price impact on high volume
    return impactCount > 0 ? totalImpact / impactCount : 0.1;
  }

  /**
   * Get default result for error cases
   */
  private getDefaultResult(): LiquidityAnalysisResult {
    return {
      score: 50,
      signals: [],
      data: {
        spread: 0.1,
        volumeProfile: {
          percentile: 50,
          average: 0,
          current: 0
        },
        marketDepth: {
          stability: 0.5,
          volatility: 1.0
        },
        tradingFrequency: {
          tradesPerMinute: 5,
          volumePerMinute: 0
        },
        priceImpact: 0.3,
        dollarVolume: 0,
        liquidityClass: 'medium'
      }
    };
  }
}