import { EODHDService, RealTimeQuote, EODData, TechnicalIndicator } from './eodhd.service';
import { getCacheService } from './cache.service';
import { getRateLimiter } from './rate-limiter.service';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';

export interface TechnicalAnalysisResult {
  score: number;
  signals: string[];
  data: {
    rsi: number;
    sma20: number;
    sma50: number;
    currentPrice: number;
    volumeRatio: number;
    dayChange: number;
    pricePosition: number;
    trendDirection: 'bullish' | 'bearish' | 'neutral';
  };
}

/**
 * Technical Analysis Service
 * Analyzes price trends, momentum, volume patterns using EODHD indicators
 * Implements aggressive caching to minimize API calls
 */
export class TechnicalAnalysisService {
  private eodhd: EODHDService;
  private cache = getCacheService();
  private rateLimiter = getRateLimiter();
  private logger = logger.createChild('TechnicalAnalysis');

  constructor(eodhd?: EODHDService) {
    this.eodhd = eodhd || new EODHDService();
  }

  /**
   * Analyze technical indicators for a symbol
   * Uses cached data when available to reduce API calls
   * @param symbol Stock symbol to analyze
   * @returns Technical analysis score (0-100), signals, and data
   */
  async analyzeSymbol(symbol: string): Promise<TechnicalAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validate symbol
      if (!symbol || symbol.length === 0) {
        throw new ValidationError('Symbol is required');
      }

      this.logger.info(`Starting technical analysis for ${symbol}`);

      // Check rate limits before proceeding
      const canProceed = await this.rateLimiter.checkLimit(8); // Max possible calls
      if (!canProceed) {
        this.logger.warn(`Rate limit would be exceeded for ${symbol}`);
        return this.getDefaultResult();
      }

      // Fetch all data in parallel with caching
      const [realTime, historical, indicators] = await Promise.all([
        this.fetchRealTimeData(symbol),
        this.fetchHistoricalData(symbol),
        this.fetchCachedIndicators(symbol)
      ]);

      // Calculate technical score using EODHD indicators
      const result = this.calculateTechnicalScore(realTime, historical, indicators);
      
      const duration = Date.now() - startTime;
      this.logger.info(`Technical analysis completed for ${symbol} in ${duration}ms`, {
        score: result.score,
        signalCount: result.signals.length
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Technical analysis failed for ${symbol}:`, error);
      return this.getDefaultResult();
    }
  }

  /**
   * Fetch real-time quote data
   * API Cost: 1 call
   */
  private async fetchRealTimeData(symbol: string): Promise<RealTimeQuote> {
    await this.rateLimiter.consume(1);
    return this.eodhd.getRealTimeQuote(symbol);
  }

  /**
   * Fetch historical data for trend analysis
   * API Cost: 1 call
   */
  private async fetchHistoricalData(symbol: string): Promise<EODData[]> {
    await this.rateLimiter.consume(1);
    return this.eodhd.getHistoricalData(symbol, 60);
  }

  /**
   * Fetch technical indicators with aggressive caching
   * API Cost: 0-15 calls (usually 0 due to cache)
   */
  private async fetchCachedIndicators(symbol: string): Promise<{
    rsi: TechnicalIndicator[];
    sma20: TechnicalIndicator[];
    sma50: TechnicalIndicator[];
  }> {
    // Check cache first for all indicators
    const [cachedRSI, cachedSMA20, cachedSMA50] = await Promise.all([
      this.cache.getCachedIndicator(symbol, 'rsi', 14),
      this.cache.getCachedIndicator(symbol, 'sma', 20),
      this.cache.getCachedIndicator(symbol, 'sma', 50)
    ]);
    
    const indicators: any = {};
    const fetchPromises: Promise<void>[] = [];
    
    // RSI - Fetch if not cached
    if (cachedRSI) {
      indicators.rsi = cachedRSI.data;
      this.logger.debug(`Using cached RSI for ${symbol}`);
    } else {
      fetchPromises.push(
        (async () => {
          await this.rateLimiter.consume(5); // RSI costs 5 API calls
          indicators.rsi = await this.eodhd.getRSI(symbol, 14);
          await this.cache.setCachedIndicator(symbol, 'rsi', indicators.rsi, {
            period: 14,
            apiCallsUsed: 5
          });
        })()
      );
    }
    
    // SMA 20 - Fetch if not cached
    if (cachedSMA20) {
      indicators.sma20 = cachedSMA20.data;
      this.logger.debug(`Using cached SMA20 for ${symbol}`);
    } else {
      fetchPromises.push(
        (async () => {
          await this.rateLimiter.consume(5); // SMA costs 5 API calls
          indicators.sma20 = await this.eodhd.getSMA(symbol, 20);
          await this.cache.setCachedIndicator(symbol, 'sma', indicators.sma20, {
            period: 20,
            apiCallsUsed: 5
          });
        })()
      );
    }
    
    // SMA 50 - Fetch if not cached
    if (cachedSMA50) {
      indicators.sma50 = cachedSMA50.data;
      this.logger.debug(`Using cached SMA50 for ${symbol}`);
    } else {
      fetchPromises.push(
        (async () => {
          await this.rateLimiter.consume(5); // SMA costs 5 API calls
          indicators.sma50 = await this.eodhd.getSMA(symbol, 50);
          await this.cache.setCachedIndicator(symbol, 'sma', indicators.sma50, {
            period: 50,
            apiCallsUsed: 5
          });
        })()
      );
    }
    
    // Wait for all missing indicators to be fetched
    await Promise.all(fetchPromises);
    
    return indicators;
  }

  /**
   * Calculate technical score based on multiple indicators
   * Implements the scoring logic from the build guide
   */
  private calculateTechnicalScore(
    realTime: RealTimeQuote,
    historical: EODData[],
    indicators: any
  ): TechnicalAnalysisResult {
    let score = 50; // Base score
    const signals: string[] = [];
    
    // Extract latest indicator values
    const currentRSI = this.getLatestValue(indicators.rsi, 'value') || 50;
    const currentSMA20 = this.getLatestValue(indicators.sma20, 'value') || realTime.close;
    const currentSMA50 = this.getLatestValue(indicators.sma50, 'value') || realTime.close;
    
    // 1. Price trend analysis using EODHD SMA
    const trendDirection = this.analyzeTrend(realTime.close, currentSMA20, currentSMA50);
    
    if (trendDirection === 'bullish') {
      score += 20;
      signals.push('Bullish trend alignment (Price > SMA20 > SMA50)');
    } else if (trendDirection === 'bearish') {
      score -= 15;
      signals.push('Bearish trend alignment (Price < SMA20 < SMA50)');
    }

    // 2. Momentum using EODHD RSI
    if (currentRSI < 30) {
      score += 15;
      signals.push(`RSI oversold (${currentRSI.toFixed(1)})`);
    } else if (currentRSI > 70) {
      score -= 10;
      signals.push(`RSI overbought (${currentRSI.toFixed(1)})`);
    } else if (currentRSI > 50 && currentRSI < 60) {
      score += 5;
      signals.push('RSI in bullish zone');
    }

    // 3. Volume analysis
    const avgVolume = this.calculateAverageVolume(historical, 20);
    const volumeRatio = realTime.volume / avgVolume;

    if (volumeRatio > 2.0) {
      score += 15;
      signals.push(`Very high volume (${volumeRatio.toFixed(1)}x avg)`);
    } else if (volumeRatio > 1.5) {
      score += 10;
      signals.push(`High volume (${volumeRatio.toFixed(1)}x avg)`);
    } else if (volumeRatio < 0.5) {
      score -= 5;
      signals.push('Low volume warning');
    }

    // 4. Price action and momentum
    const dayChange = ((realTime.close - realTime.previousClose) / realTime.previousClose) * 100;

    if (dayChange > 3) {
      score += 10;
      signals.push(`Strong upward move: +${dayChange.toFixed(1)}%`);
    } else if (dayChange < -3) {
      score -= 10;
      signals.push(`Strong downward move: ${dayChange.toFixed(1)}%`);
    }

    // 5. Price relative to day's range
    const dayRange = realTime.high - realTime.low;
    const pricePosition = dayRange > 0 ? (realTime.close - realTime.low) / dayRange : 0.5;
    
    if (pricePosition > 0.8) {
      score += 5;
      signals.push('Closing near day high');
    } else if (pricePosition < 0.2) {
      score -= 5;
      signals.push('Closing near day low');
    }

    // Ensure score is within bounds
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      score: finalScore,
      signals,
      data: {
        rsi: currentRSI,
        sma20: currentSMA20,
        sma50: currentSMA50,
        currentPrice: realTime.close,
        volumeRatio,
        dayChange,
        pricePosition,
        trendDirection
      }
    };
  }

  /**
   * Analyze trend direction based on price and moving averages
   */
  private analyzeTrend(price: number, sma20: number, sma50: number): 'bullish' | 'bearish' | 'neutral' {
    if (price > sma20 && sma20 > sma50) {
      return 'bullish';
    } else if (price < sma20 && sma20 < sma50) {
      return 'bearish';
    }
    return 'neutral';
  }

  /**
   * Calculate average volume over a period
   */
  private calculateAverageVolume(historical: EODData[], period: number): number {
    const recentData = historical.slice(-period);
    if (recentData.length === 0) return 1; // Avoid division by zero
    
    const totalVolume = recentData.reduce((sum, day) => sum + day.volume, 0);
    return totalVolume / recentData.length;
  }

  /**
   * Extract the latest value from indicator array
   */
  private getLatestValue(indicatorData: any[], field: string): number | null {
    if (!indicatorData || indicatorData.length === 0) return null;
    
    const latest = indicatorData[indicatorData.length - 1];
    return latest[field] || latest.value || null;
  }

  /**
   * Get default result for error cases
   */
  private getDefaultResult(): TechnicalAnalysisResult {
    return {
      score: 50,
      signals: [],
      data: {
        rsi: 50,
        sma20: 0,
        sma50: 0,
        currentPrice: 0,
        volumeRatio: 1,
        dayChange: 0,
        pricePosition: 0.5,
        trendDirection: 'neutral'
      }
    };
  }
}