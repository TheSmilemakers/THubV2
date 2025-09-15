import { EODHDService, RealTimeQuote, IntradayData } from './eodhd.service';
import { getRateLimiter } from './rate-limiter.service';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';

export interface SentimentAnalysisResult {
  score: number;
  signals: string[];
  data: {
    priceVelocity: number;
    volumeAnomaly: number;
    volatility: number;
    patterns: {
      accumulation: boolean;
      distribution: boolean;
      consolidation: boolean;
    };
    timeOfDay: string;
    intradayTrend: 'bullish' | 'bearish' | 'neutral';
  };
}

/**
 * Sentiment Analysis Service
 * Derives market sentiment from price/volume patterns using intraday data
 * Focuses on micro-structure analysis and short-term momentum
 */
export class SentimentAnalysisService {
  private eodhd: EODHDService;
  private rateLimiter = getRateLimiter();
  private logger = logger.createChild('SentimentAnalysis');

  constructor(eodhd?: EODHDService) {
    this.eodhd = eodhd || new EODHDService();
  }

  /**
   * Analyze sentiment using price and volume patterns
   * Uses 5-minute intraday data for micro-structure analysis
   * @param symbol Stock symbol to analyze
   * @returns Sentiment score (0-100), signals, and pattern data
   */
  async analyzeSymbol(symbol: string): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validate symbol
      if (!symbol || symbol.length === 0) {
        throw new ValidationError('Symbol is required');
      }

      this.logger.info(`Starting sentiment analysis for ${symbol}`);

      // Check rate limits (2 API calls needed)
      const canProceed = await this.rateLimiter.checkLimit(2);
      if (!canProceed) {
        this.logger.warn(`Rate limit would be exceeded for ${symbol}`);
        return this.getDefaultResult();
      }

      // Fetch intraday data and real-time quote in parallel
      const [intradayData, realTimeQuote] = await Promise.all([
        this.fetchIntradayData(symbol),
        this.fetchRealTimeQuote(symbol)
      ]);

      // Calculate sentiment score from patterns
      const result = this.calculateSentimentScore(intradayData, realTimeQuote);
      
      const duration = Date.now() - startTime;
      this.logger.info(`Sentiment analysis completed for ${symbol} in ${duration}ms`, {
        score: result.score,
        signalCount: result.signals.length
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Sentiment analysis failed for ${symbol}:`, error);
      return this.getDefaultResult();
    }
  }

  /**
   * Fetch 5-minute intraday data
   * API Cost: 1 call
   */
  private async fetchIntradayData(symbol: string): Promise<IntradayData[]> {
    await this.rateLimiter.consume(1);
    return this.eodhd.getIntradayData(symbol, '5m');
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
   * Calculate sentiment score from intraday patterns
   */
  private calculateSentimentScore(
    intradayData: IntradayData[],
    realTimeQuote: RealTimeQuote
  ): SentimentAnalysisResult {
    let score = 50; // Base score
    const signals: string[] = [];
    
    // Get last 2 hours of 5-minute data (24 candles)
    const recentData = intradayData.slice(-24);
    
    if (recentData.length < 12) {
      this.logger.warn('Insufficient intraday data for sentiment analysis');
      return {
        score,
        signals: ['Insufficient data for analysis'],
        data: this.getDefaultData()
      };
    }

    // 1. Price Velocity Analysis
    const priceVelocity = this.calculatePriceVelocity(recentData);

    if (priceVelocity > 1.5) {
      score += 15;
      signals.push(`Strong upward momentum (${priceVelocity.toFixed(2)}% per hour)`);
    } else if (priceVelocity > 0.5) {
      score += 8;
      signals.push(`Moderate upward momentum (${priceVelocity.toFixed(2)}% per hour)`);
    } else if (priceVelocity < -1.5) {
      score -= 15;
      signals.push(`Strong downward momentum (${priceVelocity.toFixed(2)}% per hour)`);
    } else if (priceVelocity < -0.5) {
      score -= 8;
      signals.push(`Moderate downward momentum (${priceVelocity.toFixed(2)}% per hour)`);
    }

    // 2. Volume Anomaly Detection
    const volumeAnomaly = this.detectVolumeAnomaly(recentData);

    if (volumeAnomaly > 2.0) {
      score += 10;
      signals.push(`Unusual volume spike (${volumeAnomaly.toFixed(1)}x normal)`);
      
      // Check if volume spike aligns with price direction
      if (priceVelocity > 0.5) {
        score += 5;
        signals.push('Volume confirms upward move');
      } else if (priceVelocity < -0.5) {
        score -= 5;
        signals.push('Volume confirms downward move');
      }
    } else if (volumeAnomaly < 0.5) {
      score -= 5;
      signals.push('Below average volume - weak conviction');
    }

    // 3. Volatility Analysis
    const volatilityScore = this.analyzeVolatility(recentData);

    if (volatilityScore > 2.0) {
      score += 10;
      signals.push('High volatility - increased market interest');
    } else if (volatilityScore > 1.5) {
      score += 5;
      signals.push('Elevated volatility');
    } else if (volatilityScore < 0.5) {
      score -= 10;
      signals.push('Low volatility - limited interest');
    }

    // 4. Micro-structure Patterns
    const microPatterns = this.detectMicroPatterns(recentData);

    if (microPatterns.accumulation) {
      score += 15;
      signals.push('Accumulation pattern detected');
    } else if (microPatterns.distribution) {
      score -= 15;
      signals.push('Distribution pattern detected');
    } else if (microPatterns.consolidation) {
      signals.push('Consolidation pattern - neutral sentiment');
    }

    // 5. Time-of-day Sentiment
    const timeAnalysis = this.analyzeTimeOfDay(recentData, priceVelocity);
    if (timeAnalysis.signal) {
      score += timeAnalysis.scoreAdjustment;
      signals.push(timeAnalysis.signal);
    }

    // Determine overall intraday trend
    const intradayTrend = this.determineIntradayTrend(priceVelocity, microPatterns);

    // Ensure score is within bounds
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      score: finalScore,
      signals,
      data: {
        priceVelocity,
        volumeAnomaly,
        volatility: volatilityScore,
        patterns: microPatterns,
        timeOfDay: timeAnalysis.timeOfDay,
        intradayTrend
      }
    };
  }

  /**
   * Calculate price velocity (rate of change per hour)
   */
  private calculatePriceVelocity(candles: IntradayData[]): number {
    if (candles.length < 2) return 0;
    
    const firstPrice = candles[0].close;
    const lastPrice = candles[candles.length - 1].close;
    const hours = (candles.length * 5) / 60; // 5-minute candles to hours
    
    return ((lastPrice - firstPrice) / firstPrice * 100) / hours;
  }

  /**
   * Detect volume anomalies by comparing recent to average volume
   */
  private detectVolumeAnomaly(candles: IntradayData[]): number {
    const volumes = candles.map(c => c.volume);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    
    // Compare last 4 candles (20 minutes) to average
    const recentVolume = volumes.slice(-4).reduce((sum, v) => sum + v, 0) / 4;
    
    return avgVolume > 0 ? recentVolume / avgVolume : 1;
  }

  /**
   * Analyze volatility using high-low ranges
   */
  private analyzeVolatility(candles: IntradayData[]): number {
    const ranges = candles.map(c => {
      const range = c.high - c.low;
      return c.close > 0 ? (range / c.close * 100) : 0;
    });
    
    const avgRange = ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
    return avgRange;
  }

  /**
   * Detect micro-structure patterns (accumulation/distribution)
   */
  private detectMicroPatterns(candles: IntradayData[]) {
    const patterns = {
      accumulation: false,
      distribution: false,
      consolidation: false
    };

    const lows = candles.map(c => c.low);
    const highs = candles.map(c => c.high);
    const volumes = candles.map(c => c.volume);
    const closes = candles.map(c => c.close);
    
    let higherLows = 0;
    let lowerHighs = 0;
    let increasingVolume = 0;
    let positiveCloses = 0;
    
    for (let i = 1; i < candles.length; i++) {
      if (lows[i] > lows[i - 1]) higherLows++;
      if (highs[i] < highs[i - 1]) lowerHighs++;
      if (volumes[i] > volumes[i - 1]) increasingVolume++;
      if (closes[i] > closes[i - 1]) positiveCloses++;
    }
    
    const percentHigherLows = higherLows / (candles.length - 1);
    const percentLowerHighs = lowerHighs / (candles.length - 1);
    const percentIncreasingVolume = increasingVolume / (candles.length - 1);
    const percentPositiveCloses = positiveCloses / (candles.length - 1);
    
    // Accumulation: higher lows with increasing volume and positive closes
    patterns.accumulation = percentHigherLows > 0.6 && 
                           percentIncreasingVolume > 0.5 &&
                           percentPositiveCloses > 0.6;
    
    // Distribution: lower highs with increasing volume and negative closes
    patterns.distribution = percentLowerHighs > 0.6 && 
                           percentIncreasingVolume > 0.5 &&
                           percentPositiveCloses < 0.4;
    
    // Consolidation: tight range with normal volume
    const priceRange = Math.max(...closes) - Math.min(...closes);
    const avgPrice = closes.reduce((sum, p) => sum + p, 0) / closes.length;
    const rangePercent = avgPrice > 0 ? (priceRange / avgPrice * 100) : 0;
    
    patterns.consolidation = rangePercent < 1 && 
                            !patterns.accumulation && 
                            !patterns.distribution;
    
    return patterns;
  }

  /**
   * Analyze time-of-day effects on sentiment
   */
  private analyzeTimeOfDay(candles: IntradayData[], priceVelocity: number) {
    const lastCandle = candles[candles.length - 1];
    const datetime = new Date(lastCandle.datetime);
    const hour = datetime.getHours();
    const minute = datetime.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    let timeOfDay = 'regular';
    let signal = '';
    let scoreAdjustment = 0;
    
    // Market open (9:30 AM - 10:00 AM EST)
    if (totalMinutes >= 570 && totalMinutes <= 600) {
      timeOfDay = 'open';
      if (priceVelocity > 0) {
        scoreAdjustment = 5;
        signal = 'Positive opening sentiment';
      } else if (priceVelocity < 0) {
        scoreAdjustment = -5;
        signal = 'Negative opening sentiment';
      }
    }
    // Power hour (3:00 PM - 4:00 PM EST)
    else if (totalMinutes >= 900 && totalMinutes <= 960) {
      timeOfDay = 'close';
      if (priceVelocity > 0) {
        scoreAdjustment = 10;
        signal = 'Strong close sentiment - bullish';
      } else if (priceVelocity < 0) {
        scoreAdjustment = -10;
        signal = 'Weak close sentiment - bearish';
      }
    }
    // Lunch hour (12:00 PM - 1:00 PM EST)
    else if (totalMinutes >= 720 && totalMinutes <= 780) {
      timeOfDay = 'lunch';
      // Reduced weight during lunch
      scoreAdjustment = 0;
    }
    
    return { timeOfDay, signal, scoreAdjustment };
  }

  /**
   * Determine overall intraday trend
   */
  private determineIntradayTrend(
    priceVelocity: number,
    patterns: any
  ): 'bullish' | 'bearish' | 'neutral' {
    if (patterns.accumulation || priceVelocity > 1.0) {
      return 'bullish';
    } else if (patterns.distribution || priceVelocity < -1.0) {
      return 'bearish';
    }
    return 'neutral';
  }

  /**
   * Get default data structure
   */
  private getDefaultData() {
    return {
      priceVelocity: 0,
      volumeAnomaly: 1,
      volatility: 1,
      patterns: {
        accumulation: false,
        distribution: false,
        consolidation: false
      },
      timeOfDay: 'regular',
      intradayTrend: 'neutral' as const
    };
  }

  /**
   * Get default result for error cases
   */
  private getDefaultResult(): SentimentAnalysisResult {
    return {
      score: 50,
      signals: [],
      data: this.getDefaultData()
    };
  }
}