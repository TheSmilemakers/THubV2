import { NextRequest, NextResponse } from 'next/server';
import { AnalysisCoordinator } from '@/lib/services/analysis-coordinator.service';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rate-limit';
import { stockSymbolSchema } from '@/lib/validation/schemas';

// Input validation schema
const QuerySchema = z.object({
  symbol: stockSymbolSchema.optional()
});

/**
 * Test endpoint for analysis functionality
 * GET /api/test-analysis?symbol=AAPL
 */
export const GET = withRateLimit(
  RATE_LIMIT_CONFIGS.api.public,
  async (request: NextRequest) => {
  const startTime = Date.now();
  const requestLogger = logger.createChild('TestAnalysisAPI');
  
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    
    // Validate input
    const validation = QuerySchema.safeParse({ symbol });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid symbol format',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    requestLogger.info(`Starting analysis for symbol: ${symbol}`);

    // Initialize coordinator and run analysis
    const coordinator = new AnalysisCoordinator();
    const result = await coordinator.analyzeStock(symbol);
    
    // Get API usage stats
    const apiStats = coordinator.getApiUsageStats();
    
    const totalTime = Date.now() - startTime;

    // Build response
    const response = {
      success: !!result.signal,
      symbol: result.symbol,
      signal: result.signal,
      metrics: {
        ...result.metrics,
        totalTime
      },
      apiUsage: {
        minute: {
          used: apiStats.minute.used,
          remaining: apiStats.minute.remaining,
          percentage: `${apiStats.minute.percentage.toFixed(1)}%`
        },
        daily: {
          used: apiStats.daily.used,
          remaining: apiStats.daily.remaining,
          percentage: `${apiStats.daily.percentage.toFixed(1)}%`
        },
        approachingLimit: apiStats.isApproachingLimit
      },
      timestamp: new Date().toISOString()
    };

    // Log summary
    requestLogger.info(`Analysis completed for ${symbol}`, {
      success: response.success,
      convergenceScore: result.signal?.convergence_score || 0,
      signalStrength: result.signal?.signal_strength || 'N/A',
      executionTime: totalTime,
      apiCallsUsed: result.metrics.apiCallsUsed
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    requestLogger.error('Analysis failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
);

/**
 * POST endpoint for batch analysis (preview for n8n integration)
 */
export const POST = withRateLimit(
  RATE_LIMIT_CONFIGS.api.public,
  async (request: NextRequest) => {
  const startTime = Date.now();
  const requestLogger = logger.createChild('TestAnalysisAPI');
  
  try {
    const body = await request.json();
    
    // Validate request body
    const BatchSchema = z.object({
      symbols: z.array(stockSymbolSchema).min(1).max(10)
    });
    
    const validation = BatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { symbols } = validation.data;
    requestLogger.info(`Starting batch analysis for ${symbols.length} symbols`);

    // Run batch analysis
    const coordinator = new AnalysisCoordinator();
    const batchResult = await coordinator.analyzeBatch(symbols);
    
    // Get final API stats
    const apiStats = coordinator.getApiUsageStats();
    
    const totalTime = Date.now() - startTime;

    // Build response
    const response = {
      success: true,
      summary: {
        ...batchResult.summary,
        executionTime: totalTime,
        successRate: `${((batchResult.summary.signalsCreated / symbols.length) * 100).toFixed(1)}%`
      },
      results: batchResult.results.map(r => ({
        symbol: r.symbol,
        signalCreated: !!r.signal,
        convergenceScore: r.signal?.convergence_score || 0,
        signalStrength: r.signal?.signal_strength || null,
        apiCallsUsed: r.metrics.apiCallsUsed
      })),
      apiUsage: {
        minute: {
          used: apiStats.minute.used,
          remaining: apiStats.minute.remaining,
          percentage: `${apiStats.minute.percentage.toFixed(1)}%`
        },
        daily: {
          used: apiStats.daily.used,
          remaining: apiStats.daily.remaining,
          percentage: `${apiStats.daily.percentage.toFixed(1)}%`
        },
        approachingLimit: apiStats.isApproachingLimit
      },
      timestamp: new Date().toISOString()
    };

    requestLogger.info('Batch analysis completed', {
      totalSymbols: symbols.length,
      signalsCreated: batchResult.summary.signalsCreated,
      totalApiCalls: batchResult.summary.apiCallsUsed,
      executionTime: totalTime
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    requestLogger.error('Batch analysis failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
);