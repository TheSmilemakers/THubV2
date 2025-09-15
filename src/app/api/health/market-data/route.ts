import { NextRequest, NextResponse } from 'next/server';
import { EODHDService } from '@/lib/services/eodhd.service';
import { getMarketDataEnrichmentService } from '@/lib/services/market-data-enrichment.service';
import { getRateLimiter } from '@/lib/services/rate-limiter.service';
import { logger } from '@/lib/logger';

/**
 * Market Data Health Check Endpoint
 * Tests connectivity to EODHD API and service status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const healthLogger = logger.createChild('MarketDataHealth');
  
  try {
    // Initialize services
    const eodhd = new EODHDService();
    const enrichmentService = getMarketDataEnrichmentService();
    const rateLimiter = getRateLimiter();
    
    // Test results
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      services: {
        eodhd: {
          status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
          latency: 0,
          error: null as string | null
        },
        websocket: {
          status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
          connected: false,
          subscriptions: 0
        },
        rateLimiter: {
          status: 'healthy' as 'healthy' | 'warning' | 'critical',
          limits: {
            minute: { used: 0, remaining: 0, percentage: 0 },
            daily: { used: 0, remaining: 0, percentage: 0 }
          }
        }
      },
      executionTime: 0
    };

    // Test EODHD API connection with a lightweight call
    const eodhTestStart = Date.now();
    try {
      // Test with a simple market check (US market status)
      const canProceed = await rateLimiter.checkLimit(1);
      if (canProceed) {
        // Use a lightweight endpoint to test connectivity
        await eodhd.getRealTimeQuote('AAPL'); // Small test with Apple
        results.services.eodhd.status = 'healthy';
      } else {
        results.services.eodhd.status = 'healthy';
        results.services.eodhd.error = 'Rate limited - not testing actual API call';
      }
      results.services.eodhd.latency = Date.now() - eodhTestStart;
    } catch (error) {
      results.services.eodhd.status = 'unhealthy';
      results.services.eodhd.error = error instanceof Error ? error.message : 'Unknown error';
      results.services.eodhd.latency = Date.now() - eodhTestStart;
      healthLogger.error('EODHD API health check failed', error);
    }

    // Test market data enrichment service
    try {
      const enrichmentStats = enrichmentService.getStats();
      results.services.websocket.connected = enrichmentStats.websocketConnected;
      results.services.websocket.subscriptions = enrichmentStats.totalSubscriptions;
      results.services.websocket.status = enrichmentStats.websocketConnected ? 'healthy' : 'unhealthy';
    } catch (error) {
      results.services.websocket.status = 'unhealthy';
      healthLogger.error('Market data enrichment service check failed', error);
    }

    // Check rate limiter status
    try {
      const rateLimiterStats = rateLimiter.getStats();
      results.services.rateLimiter.limits = {
        minute: {
          used: rateLimiterStats.minute.used,
          remaining: rateLimiterStats.minute.remaining,
          percentage: Math.round((rateLimiterStats.minute.used / (rateLimiterStats.minute.used + rateLimiterStats.minute.remaining)) * 100)
        },
        daily: {
          used: rateLimiterStats.daily.used,
          remaining: rateLimiterStats.daily.remaining,
          percentage: Math.round((rateLimiterStats.daily.used / (rateLimiterStats.daily.used + rateLimiterStats.daily.remaining)) * 100)
        }
      };

      // Set rate limiter status based on usage
      const minutePercentage = results.services.rateLimiter.limits.minute.percentage;
      const dailyPercentage = results.services.rateLimiter.limits.daily.percentage;
      
      if (minutePercentage > 90 || dailyPercentage > 90) {
        results.services.rateLimiter.status = 'critical';
      } else if (minutePercentage > 80 || dailyPercentage > 80) {
        results.services.rateLimiter.status = 'warning';
      } else {
        results.services.rateLimiter.status = 'healthy';
      }
    } catch (error) {
      results.services.rateLimiter.status = 'critical';
      healthLogger.error('Rate limiter check failed', error);
    }

    // Determine overall status
    if (results.services.eodhd.status === 'unhealthy') {
      results.status = 'unhealthy';
    } else if (
      results.services.websocket.status === 'unhealthy' ||
      results.services.rateLimiter.status === 'critical'
    ) {
      results.status = 'degraded';
    } else {
      results.status = 'healthy';
    }

    results.executionTime = Date.now() - startTime;

    // Log health check results
    healthLogger.info('Market data health check completed', {
      status: results.status,
      executionTime: results.executionTime,
      eodhdStatus: results.services.eodhd.status,
      websocketConnected: results.services.websocket.connected
    });

    // Return appropriate HTTP status
    const httpStatus = results.status === 'healthy' ? 200 : 
                      results.status === 'degraded' ? 503 : 500;

    return NextResponse.json(results, { status: httpStatus });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    healthLogger.error('Health check failed with exception', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: errorMessage,
        executionTime: Date.now() - startTime,
        services: {
          eodhd: { status: 'unknown', error: 'Health check failed' },
          websocket: { status: 'unknown', connected: false },
          rateLimiter: { status: 'unknown' }
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual health check triggers (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Simple admin token check (in production, use proper auth)
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'reset-rate-limiter') {
      // Reset rate limiter counters (for testing)
      const rateLimiter = getRateLimiter();
      rateLimiter.reset();
      
      return NextResponse.json({
        success: true,
        message: 'Rate limiter reset successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'reconnect-websocket') {
      // Force WebSocket reconnection
      const enrichmentService = getMarketDataEnrichmentService();
      await enrichmentService.initialize();
      
      return NextResponse.json({
        success: true,
        message: 'WebSocket reconnection initiated',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}