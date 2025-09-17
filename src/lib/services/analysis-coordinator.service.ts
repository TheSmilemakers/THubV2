import { TechnicalAnalysisService } from './technical-analysis.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';
import { LiquidityAnalysisService } from './liquidity-analysis.service';
import { ScoringService } from './scoring.service';
import { getRateLimiter } from './rate-limiter.service';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { Signal, CreateSignalInput, SignalStrength } from '@/types/database.types';
import { MarketFilters, MarketCandidate, MarketScanResult } from '@/types/market-scanner.types';
import { ValidationError } from '@/lib/errors';
import { EODHDService } from './eodhd.service';

export interface AnalysisResult {
  symbol: string;
  signal: Signal | null;
  metrics: {
    analysisTime: number;
    apiCallsUsed: number;
    cacheHits: number;
  };
}

export interface BatchAnalysisResult {
  results: AnalysisResult[];
  summary: {
    totalSymbols: number;
    signalsCreated: number;
    totalTime: number;
    apiCallsUsed: number;
  };
}

export interface MarketOverview {
  totalSignals: number;
  strongSignals: number;
  averageScore: number;
  topSymbols: Array<{
    symbol: string;
    score: number;
    strength: SignalStrength;
  }>;
}

/**
 * Analysis Coordinator Service
 * Orchestrates all analysis layers and manages signal creation
 * Uses singleton instances for shared services
 */
export class AnalysisCoordinator {
  private technical: TechnicalAnalysisService;
  private sentiment: SentimentAnalysisService;
  private liquidity: LiquidityAnalysisService;
  private scoring: ScoringService;
  private eodhd: EODHDService;
  private rateLimiter = getRateLimiter();
  private logger = logger.createChild('AnalysisCoordinator');

  constructor() {
    // Initialize services (they use singleton patterns internally)
    this.technical = new TechnicalAnalysisService();
    this.sentiment = new SentimentAnalysisService();
    this.liquidity = new LiquidityAnalysisService();
    this.scoring = new ScoringService();
    this.eodhd = new EODHDService();
  }

  /**
   * Analyze a single stock symbol
   * Runs all 3 analyses in parallel and creates signal if score >= 70
   */
  async analyzeStock(symbol: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const initialStats = this.rateLimiter.getStats();
    
    try {
      // Validate symbol
      if (!symbol || symbol.length === 0) {
        throw new ValidationError('Symbol is required');
      }

      // Check rate limits before proceeding
      // Technical: 2-17 calls, Sentiment: 2 calls, Liquidity: 3 calls = max 22 calls
      // But with caching, typical is 4-6 calls total
      const canProceed = await this.rateLimiter.checkLimit(11);
      if (!canProceed) {
        this.logger.warn(`Rate limit reached, skipping analysis for ${symbol}`);
        return {
          symbol,
          signal: null,
          metrics: {
            analysisTime: 0,
            apiCallsUsed: 0,
            cacheHits: 0
          }
        };
      }

      this.logger.info(`Starting comprehensive analysis for ${symbol}`);

      // Run all analyses in parallel for efficiency
      const [techResult, sentResult, liqResult] = await Promise.all([
        this.technical.analyzeSymbol(symbol),
        this.sentiment.analyzeSymbol(symbol),
        this.liquidity.analyzeSymbol(symbol)
      ]);

      // Calculate convergence score
      const convergence = this.scoring.calculateConvergence({
        technical: techResult.score,
        sentiment: sentResult.score,
        liquidity: liqResult.score
      });

      const analysisTime = Date.now() - startTime;
      const finalStats = this.rateLimiter.getStats();
      const minuteDelta = Math.max(0, finalStats.minute.used - initialStats.minute.used);
      const dailyDelta = Math.max(0, finalStats.daily.used - initialStats.daily.used);
      const apiCallsUsed = minuteDelta + dailyDelta;

      this.logger.info(
        `Analysis completed for ${symbol} in ${analysisTime}ms. Score: ${convergence.score}`,
        {
          technical: techResult.score,
          sentiment: sentResult.score,
          liquidity: liqResult.score,
          convergence: convergence.score,
          strength: convergence.strength
        }
      );

      // Log API usage
      const remaining = this.rateLimiter.getRemainingCalls();
      this.logger.debug(`API calls remaining - Minute: ${remaining.minute}, Daily: ${remaining.daily}`);

      let signal = null;

      // Only store high-confidence signals
      if (convergence.score >= 70) {
        signal = await this.createSignal(
          symbol,
          convergence,
          techResult,
          sentResult,
          liqResult
        );
        
        this.logger.info(`High-confidence signal created for ${symbol}: ${convergence.score}%`);
      } else {
        this.logger.debug(`Signal for ${symbol} below threshold: ${convergence.score}%`);
      }

      return {
        symbol,
        signal,
        metrics: {
          analysisTime,
          apiCallsUsed: apiCallsUsed,
          cacheHits: 0 // TODO: Track cache hits from services
        }
      };
    } catch (error) {
      this.logger.error(`Analysis failed for ${symbol}:`, error);
      return {
        symbol,
        signal: null,
        metrics: {
          analysisTime: Date.now() - startTime,
          apiCallsUsed: 0,
          cacheHits: 0
        }
      };
    }
  }

  /**
   * Analyze multiple symbols in batches
   * Respects rate limits and adds delays between batches
   */
  async analyzeBatch(symbols: string[]): Promise<BatchAnalysisResult> {
    const startTime = Date.now();
    const results: AnalysisResult[] = [];
    let totalApiCalls = 0;
    let signalsCreated = 0;
    
    // Process in smaller batches to respect rate limits
    const batchSize = 10;
    
    this.logger.info(`Starting batch analysis for ${symbols.length} symbols`);
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(symbols.length / batchSize);
      
      // Check if we have enough API calls for the batch
      const requiredCalls = batch.length * 11; // Max calls per symbol
      const canProceed = await this.rateLimiter.checkLimit(requiredCalls);
      
      if (!canProceed) {
        this.logger.warn(`Rate limit reached at batch ${batchNumber}/${totalBatches}`);
        break;
      }
      
      this.logger.info(`Processing batch ${batchNumber}/${totalBatches}`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(symbol => this.analyzeStock(symbol))
      );
      
      // Track results
      batchResults.forEach(result => {
        results.push(result);
        totalApiCalls += result.metrics.apiCallsUsed;
        if (result.signal) signalsCreated++;
      });
      
      // Add delay between batches to avoid hitting minute limits
      if (i + batchSize < symbols.length) {
        const delay = this.rateLimiter.getOptimalDelay();
        this.logger.debug(`Waiting ${delay}ms before next batch`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    this.logger.info(`Batch analysis completed in ${totalTime}ms`, {
      totalSymbols: symbols.length,
      processedSymbols: results.length,
      signalsCreated,
      totalApiCalls
    });
    
    return {
      results,
      summary: {
        totalSymbols: symbols.length,
        signalsCreated,
        totalTime,
        apiCallsUsed: totalApiCalls
      }
    };
  }

  /**
   * Create and store a signal in the database
   */
  private async createSignal(
    symbol: string,
    convergence: any,
    technical: any,
    sentiment: any,
    liquidity: any
  ): Promise<Signal> {
    const currentPrice = technical.data.currentPrice || 0;
    
    // Calculate dynamic stop loss and take profit based on volatility
    const volatility = sentiment.data.volatility || 2.0;
    const liquidityClass = liquidity.data.liquidityClass;
    
    // Adjust risk based on liquidity
    const liquidityMultiplier = liquidityClass === 'high' ? 1.0 : 
                               liquidityClass === 'medium' ? 0.8 : 0.6;
    
    const stopLossPercent = Math.max(2, Math.min(5, volatility * 1.5 * liquidityMultiplier));
    const takeProfitPercent = Math.max(3, Math.min(10, volatility * 2.5 * liquidityMultiplier));
    
    const signalData: CreateSignalInput = {
      symbol,
      market: 'stocks_us',
      technical_score: technical.score,
      sentiment_score: sentiment.score,
      liquidity_score: liquidity.score,
      convergence_score: convergence.score,
      signal_strength: convergence.strength,
      current_price: currentPrice,
      entry_price: currentPrice,
      stop_loss: currentPrice * (1 - stopLossPercent / 100),
      take_profit: currentPrice * (1 + takeProfitPercent / 100),
      technical_data: {
        indicators: {
          rsi: technical.data.rsi,
          sma: {
            sma20: technical.data.sma20,
            sma50: technical.data.sma50
          }
        },
        trend: technical.data.trendDirection,
        volume: {
          current: technical.data.volumeRatio * 100,
          average: 100,
          ratio: technical.data.volumeRatio
        },
        sentiment_metrics: sentiment.data,
        liquidity_metrics: liquidity.data
      },
      analysis_notes: [
        ...technical.signals,
        ...sentiment.signals,
        ...liquidity.signals,
        `Risk-adjusted for ${liquidityClass} liquidity`
      ]
    };

    try {
      // Use server-side Supabase client with service role for write access
      const supabase = await createClient();
      
      // Need to create a service role client for writes
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data, error } = await serviceClient
        .from('signals')
        .insert(signalData)
        .select()
        .single();

      if (error) {
        this.logger.error(`Failed to create signal for ${symbol}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      this.logger.error(`Database error creating signal for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get market overview with recent signals
   */
  async getMarketOverview(): Promise<MarketOverview | null> {
    try {
      // Use service role client for reading
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Get signals from last 24 hours
      const { data: recentSignals, error } = await supabase
        .from('signals')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('convergence_score', { ascending: false })
        .limit(20);
      
      if (error) {
        this.logger.error('Failed to fetch market overview:', error);
        return null;
      }
      
      const signals = recentSignals || [];
      
      const overview: MarketOverview = {
        totalSignals: signals.length,
        strongSignals: signals.filter(s => 
          s.signal_strength === 'STRONG' || s.signal_strength === 'VERY_STRONG'
        ).length,
        averageScore: signals.length > 0 
          ? signals.reduce((sum, s) => sum + s.convergence_score, 0) / signals.length 
          : 0,
        topSymbols: signals.slice(0, 5).map(s => ({
          symbol: s.symbol,
          score: s.convergence_score,
          strength: s.signal_strength
        }))
      };
      
      this.logger.info('Market overview generated', {
        totalSignals: overview.totalSignals,
        strongSignals: overview.strongSignals
      });
      
      return overview;
    } catch (error) {
      this.logger.error('Failed to get market overview:', error);
      return null;
    }
  }

  /**
   * Get current API usage statistics
   */
  getApiUsageStats() {
    const stats = this.rateLimiter.getStats();
    const usage = this.rateLimiter.getUsagePercentage();
    
    return {
      minute: {
        used: stats.minute.used,
        remaining: stats.minute.remaining,
        percentage: usage.minute,
        resetIn: stats.minute.resetIn
      },
      daily: {
        used: stats.daily.used,
        remaining: stats.daily.remaining,
        percentage: usage.daily,
        resetIn: stats.daily.resetIn
      },
      isApproachingLimit: this.rateLimiter.isApproachingLimit()
    };
  }

  /**
   * Scan the entire market for trading opportunities
   * Uses bulk EOD data to find high-potential candidates
   */
  async scanMarket(filters?: MarketFilters): Promise<MarketScanResult> {
    const startTime = Date.now();
    const scanId = crypto.randomUUID();
    
    try {
      this.logger.info('Starting market scan', { scanId, filters });
      
      // Step 1: Check rate limits (bulk EOD is 1 call per 1000 symbols)
      const canProceed = await this.rateLimiter.checkLimit(5); // Conservative estimate
      if (!canProceed) {
        this.logger.warn('Rate limit reached, cannot perform market scan');
        return {
          totalSymbols: 0,
          filteredSymbols: 0,
          candidates: [],
          scanTime: 0,
          scanId
        };
      }
      
      // Step 2: Get bulk EOD data for the exchange
      const exchange = filters?.exchange || 'US';
      const allSymbols = await this.eodhd.getBulkEOD(exchange);
      
      this.logger.info(`Fetched ${allSymbols.length} symbols from ${exchange} exchange`);
      
      // Step 3: Apply filters
      const filtered = allSymbols.filter(symbol => {
        // Skip if no volume data
        if (!symbol.volume || symbol.volume === 0) return false;
        
        // Volume filter
        if (filters?.minVolume && symbol.volume < filters.minVolume) {
          return false;
        }
        
        // Price range filter
        if (filters?.minPrice && symbol.close < filters.minPrice) {
          return false;
        }
        if (filters?.maxPrice && symbol.close > filters.maxPrice) {
          return false;
        }
        
        // Daily change filter - skip for now as bulk EOD doesn't include previous close
        // TODO: Implement by fetching previous day data or using different endpoint
        if (filters?.minDailyChange) {
          // For now, we'll use a rough estimate based on open vs close
          const intraday_change = ((symbol.close - symbol.open) / symbol.open) * 100;
          if (Math.abs(intraday_change) < filters.minDailyChange) {
            return false;
          }
        }
        
        return true;
      });
      
      this.logger.info(`Filtered to ${filtered.length} symbols meeting criteria`);
      
      // Step 4: Calculate opportunity scores and create candidates
      const candidates: MarketCandidate[] = filtered.map(symbol => {
        // Use intraday change since we don't have previous day's close
        const change = symbol.close - symbol.open;
        const changePercent = (change / symbol.open) * 100;
        const dollarVolume = symbol.close * symbol.volume;
        
        return {
          symbol: symbol.code,
          price: symbol.close,
          volume: symbol.volume,
          change: change,
          changePercent: changePercent,
          dollarVolume: dollarVolume,
          opportunityScore: this.calculateOpportunityScore(symbol),
          scanReason: this.determineScanReason(symbol, changePercent)
        };
      });
      
      // Step 5: Sort by opportunity score and limit
      const topCandidates = candidates
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, filters?.limit || 30);
      
      const scanTime = Date.now() - startTime;
      
      // Step 6: Store scan results in database
      await this.storeScanResults(scanId, {
        totalSymbols: allSymbols.length,
        filteredSymbols: filtered.length,
        candidatesFound: topCandidates.length,
        scanTime,
        filters: filters || {}
      });
      
      // Step 7: Queue top candidates for analysis
      await this.queueCandidatesForAnalysis(topCandidates, scanId);
      
      this.logger.info('Market scan completed', {
        scanId,
        totalSymbols: allSymbols.length,
        filtered: filtered.length,
        candidates: topCandidates.length,
        scanTime
      });
      
      return {
        totalSymbols: allSymbols.length,
        filteredSymbols: filtered.length,
        candidates: topCandidates,
        scanTime,
        scanId
      };
    } catch (error) {
      this.logger.error('Market scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Calculate opportunity score for a symbol
   */
  private calculateOpportunityScore(symbol: any): number {
    let score = 0;
    
    // Volume component (30 points max)
    // Assume average volume is 80% of current for now (would need historical data)
    const estimatedAvgVolume = symbol.volume * 0.8;
    const volumeRatio = symbol.volume / (estimatedAvgVolume || symbol.volume);
    score += Math.min(volumeRatio * 10, 30);
    
    // Price momentum component (40 points max)
    // Use intraday change as proxy for momentum
    const changePercent = Math.abs((symbol.close - symbol.open) / symbol.open * 100);
    score += Math.min(changePercent * 4, 40);
    
    // Dollar volume liquidity component (30 points max)
    const dollarVolume = symbol.close * symbol.volume;
    const liquidityScore = Math.min(dollarVolume / 1000000, 30);
    score += liquidityScore;
    
    return Math.round(score);
  }

  /**
   * Determine the reason a symbol was selected in the scan
   */
  private determineScanReason(symbol: any, changePercent: number): string {
    const reasons: string[] = [];
    
    // Volume spike
    const estimatedAvgVolume = symbol.volume * 0.8;
    const volumeRatio = symbol.volume / estimatedAvgVolume;
    if (volumeRatio > 2) {
      reasons.push('volume_spike');
    }
    
    // Price movement
    if (Math.abs(changePercent) > 5) {
      reasons.push('significant_move');
    } else if (Math.abs(changePercent) > 3) {
      reasons.push('moderate_move');
    }
    
    // High liquidity
    const dollarVolume = symbol.close * symbol.volume;
    if (dollarVolume > 10000000) {
      reasons.push('high_liquidity');
    }
    
    return reasons.join(',') || 'general_scan';
  }

  /**
   * Store market scan results in the database
   */
  private async storeScanResults(scanId: string, results: any): Promise<void> {
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabase
        .from('market_scan_history')
        .insert({
          scan_id: scanId,
          total_symbols: results.totalSymbols,
          filtered_symbols: results.filteredSymbols,
          candidates_found: results.candidatesFound,
          scan_duration_ms: results.scanTime,
          filters_used: results.filters,
          api_calls_used: 1 // Bulk EOD is 1 call
        });
    } catch (error) {
      this.logger.error('Failed to store scan results', { error, scanId });
      // Non-critical error, continue
    }
  }

  /**
   * Queue candidates for detailed analysis
   */
  private async queueCandidatesForAnalysis(candidates: MarketCandidate[], scanId: string): Promise<void> {
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const queueEntries = candidates.map(candidate => ({
        symbol: candidate.symbol,
        scan_timestamp: new Date().toISOString(),
        scan_reason: candidate.scanReason,
        opportunity_score: candidate.opportunityScore,
        filters_matched: {
          price: candidate.price,
          volume: candidate.volume,
          changePercent: candidate.changePercent,
          dollarVolume: candidate.dollarVolume
        },
        priority: Math.min(candidate.opportunityScore, 100)
      }));
      
      await supabase
        .from('market_scan_queue')
        .insert(queueEntries);
        
      this.logger.info(`Queued ${candidates.length} candidates for analysis`);
    } catch (error) {
      this.logger.error('Failed to queue candidates', { error, scanId });
      // Non-critical error, continue
    }
  }
}
