import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AnalysisCoordinator } from '@/lib/services/analysis-coordinator.service';
import { logger } from '@/lib/logger';
import { withBodyValidation, validationErrorResponse } from '@/lib/validation/helpers';
import { stockSymbolSchema } from '@/lib/validation/schemas';

// Simple in-memory rate limiting for webhook requests
const webhookRequestTracker = new Map<string, { count: number; resetTime: number }>();
const WEBHOOK_RATE_LIMIT = 10; // 10 requests per minute per IP
const WEBHOOK_WINDOW = 60 * 1000; // 1 minute

function checkWebhookRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const tracker = webhookRequestTracker.get(clientIp);
  
  if (!tracker) {
    webhookRequestTracker.set(clientIp, { count: 1, resetTime: now + WEBHOOK_WINDOW });
    return true;
  }
  
  if (now > tracker.resetTime) {
    // Reset window
    tracker.count = 1;
    tracker.resetTime = now + WEBHOOK_WINDOW;
    return true;
  }
  
  if (tracker.count >= WEBHOOK_RATE_LIMIT) {
    return false;
  }
  
  tracker.count++;
  return true;
}

// Webhook request schema
const WebhookSchema = z.object({
  action: z.enum(['analyze', 'batch_analyze', 'market_overview', 'market_scan']),
  symbols: z.array(stockSymbolSchema).min(1).max(50).optional(),
  priority: z.enum(['high', 'normal', 'low']).optional().default('normal'),
  metadata: z.record(z.any()).optional(),
  filters: z.object({
    exchange: z.string().default('US'),
    minVolume: z.number().positive().default(1000000),
    minPrice: z.number().positive().default(5),
    maxPrice: z.number().positive().default(500),
    minDailyChange: z.number().min(-100).max(100).default(2),
    excludeSectors: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(50).default(30)
  }).optional()
});

type WebhookRequest = z.infer<typeof WebhookSchema>;

/**
 * n8n Webhook Endpoint for Trading Analysis
 * Secured with Bearer token authentication
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const webhookLogger = logger.createChild('n8nWebhook');
  
  webhookLogger.info(`Webhook request received`, { requestId });
  
  try {
    // Step 1: Check webhook rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkWebhookRateLimit(clientIp)) {
      webhookLogger.warn('Webhook rate limit exceeded', { 
        requestId,
        clientIp: clientIp.substring(0, 10) + '...'
      });
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Maximum ${WEBHOOK_RATE_LIMIT} requests per minute`,
          requestId 
        },
        { status: 429 }
      );
    }

    // Step 2: Verify webhook authentication
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.N8N_WEBHOOK_SECRET}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      webhookLogger.warn('Unauthorized webhook attempt', { 
        requestId,
        authHeader: authHeader?.substring(0, 20) + '...',
        clientIp: clientIp.substring(0, 10) + '...'
      });
      
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          requestId 
        },
        { status: 401 }
      );
    }

    // Step 3: Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          requestId 
        },
        { status: 400 }
      );
    }

    const validation = WebhookSchema.safeParse(body);
    if (!validation.success) {
      webhookLogger.warn('Invalid webhook request format', {
        requestId,
        errors: validation.error.errors
      });
      
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validation.error.errors,
          requestId
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    webhookLogger.info('Processing webhook action', {
      requestId,
      action: validatedData.action,
      symbolCount: validatedData.symbols?.length || 0,
      priority: validatedData.priority
    });

    // Step 4: Initialize coordinator
    const coordinator = new AnalysisCoordinator();
    
    // Step 5: Process based on action type
    let response: any;
    
    switch (validatedData.action) {
      case 'analyze':
        if (!validatedData.symbols || validatedData.symbols.length === 0) {
          return NextResponse.json(
            {
              error: 'Symbols required for analyze action',
              requestId
            },
            { status: 400 }
          );
        }
        
        // Single symbol analysis
        const symbol = validatedData.symbols[0];
        const result = await coordinator.analyzeStock(symbol);
        
        response = {
          success: true,
          action: 'analyze',
          requestId,
          result: {
            symbol: result.symbol,
            signalCreated: !!result.signal,
            convergenceScore: result.signal?.convergence_score || 0,
            signalStrength: result.signal?.signal_strength || null,
            metrics: result.metrics
          },
          timestamp: new Date().toISOString()
        };
        break;

      case 'batch_analyze':
        if (!validatedData.symbols || validatedData.symbols.length === 0) {
          return NextResponse.json(
            {
              error: 'Symbols required for batch_analyze action',
              requestId
            },
            { status: 400 }
          );
        }
        
        // Batch analysis with priority handling
        const batchResult = await coordinator.analyzeBatch(validatedData.symbols);
        
        response = {
          success: true,
          action: 'batch_analyze',
          requestId,
          summary: {
            totalSymbols: batchResult.summary.totalSymbols,
            signalsCreated: batchResult.summary.signalsCreated,
            successRate: ((batchResult.summary.signalsCreated / batchResult.summary.totalSymbols) * 100).toFixed(1) + '%',
            totalTime: batchResult.summary.totalTime,
            apiCallsUsed: batchResult.summary.apiCallsUsed
          },
          results: batchResult.results.map(r => ({
            symbol: r.symbol,
            signalCreated: !!r.signal,
            convergenceScore: r.signal?.convergence_score || 0,
            signalStrength: r.signal?.signal_strength || null
          })),
          timestamp: new Date().toISOString()
        };
        break;

      case 'market_overview':
        const overview = await coordinator.getMarketOverview();
        
        response = {
          success: true,
          action: 'market_overview',
          requestId,
          overview: overview || {
            totalSignals: 0,
            strongSignals: 0,
            averageScore: 0,
            topSymbols: []
          },
          timestamp: new Date().toISOString()
        };
        break;

      case 'market_scan':
        webhookLogger.info('Starting market scan', {
          requestId,
          filters: validatedData.filters
        });
        
        const scanResult = await coordinator.scanMarket(validatedData.filters);
        
        response = {
          success: true,
          action: 'market_scan',
          requestId,
          summary: {
            totalScanned: scanResult.totalSymbols,
            filtered: scanResult.filteredSymbols,
            queued: scanResult.candidates.length
          },
          candidates: scanResult.candidates.slice(0, 5), // Preview top 5
          timestamp: new Date().toISOString(),
          scanId: scanResult.scanId
        };
        
        webhookLogger.info('Market scan completed', {
          requestId,
          totalScanned: scanResult.totalSymbols,
          candidatesFound: scanResult.candidates.length,
          scanTime: scanResult.scanTime
        });
        break;

      default:
        // This should never happen due to Zod validation
        throw new Error(`Unknown action: ${(validatedData as any).action}`);
    }

    // Add API usage stats to response
    const apiStats = coordinator.getApiUsageStats();
    response.apiUsage = {
      minute: {
        used: apiStats.minute.used,
        remaining: apiStats.minute.remaining,
        percentage: apiStats.minute.percentage.toFixed(1) + '%',
        resetIn: apiStats.minute.resetIn
      },
      daily: {
        used: apiStats.daily.used,
        remaining: apiStats.daily.remaining,
        percentage: apiStats.daily.percentage.toFixed(1) + '%',
        resetIn: apiStats.daily.resetIn
      },
      approachingLimit: apiStats.isApproachingLimit,
      warningLevel: apiStats.minute.percentage > 80 ? 'high' : 
                   apiStats.minute.percentage > 60 ? 'medium' : 'normal'
    };

    // Add execution time
    response.executionTime = Date.now() - startTime;

    // Log successful completion
    webhookLogger.info('Webhook processed successfully', {
      requestId,
      action: validatedData.action,
      executionTime: response.executionTime,
      apiCallsUsed: response.summary?.apiCallsUsed || 0
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    webhookLogger.error('Webhook processing failed', {
      requestId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    webhook: 'n8n Trading Analysis',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: {
        actions: ['analyze', 'batch_analyze', 'market_overview', 'market_scan'],
        authentication: 'Bearer token required',
        maxSymbols: 50,
        marketScanFilters: {
          exchange: 'US (default)',
          minVolume: '1000000 (default)',
          minPrice: '5 (default)',
          maxPrice: '500 (default)',
          minDailyChange: '2% (default)',
          excludeSectors: 'array of sectors to exclude',
          limit: '30 (default, max 50)'
        }
      }
    }
  });
}