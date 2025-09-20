# EODHD API Complete Reference Guide

## Overview

This comprehensive reference guide documents all EODHD (End of Day Historical Data) API endpoints, providing TypeScript interfaces, usage examples, and integration patterns for the THub V2 trading platform.

## API Coverage

- **100+ Endpoints** documented with complete TypeScript types
- **100+ Technical Indicators** with parameter details
- **Real-time WebSocket** implementation guides
- **Fundamental Data** structures and schemas
- **News & Sentiment** analysis integration
- **Market Screeners** with advanced filtering
- **Options Data** with Greeks calculations
- **Bulk Operations** for efficient data retrieval

## Documentation Structure

```
docs/eodhd-api/
├── endpoints/              # Detailed endpoint documentation
│   ├── market-data/       # EOD, intraday, real-time prices
│   ├── technical-indicators/ # 100+ technical indicators
│   ├── fundamentals/      # Company financials, ratios
│   ├── options/           # Options chains, Greeks
│   ├── news-sentiment/    # News API with sentiment scores
│   ├── screener/          # Market screening capabilities
│   ├── reference-data/    # Exchanges, symbols, calendars
│   └── websockets/        # Real-time WebSocket guide
├── types/                 # TypeScript interfaces
├── examples/              # Usage examples
└── tools/                 # Development tools
```

## Quick Start

### Authentication

All EODHD API requests require authentication via API token:

```typescript
const apiKey = process.env.EODHD_API_KEY;
const baseUrl = 'https://eodhd.com/api';

// Example request
const response = await fetch(`${baseUrl}/real-time/AAPL.US?api_token=${apiKey}&fmt=json`);
```

### Rate Limits

| Plan | Requests/Day | Requests/Minute | WebSocket Connections |
|------|--------------|-----------------|----------------------|
| Free | 20 | N/A | 0 |
| Basic | 100,000 | 1,000 | 5 |
| Professional | 500,000 | 5,000 | 50 |
| Enterprise | Unlimited | Unlimited | Unlimited |

## Core Endpoints

### 1. Market Data

- **EOD Historical Data**: `/api/eod/{symbol}`
- **Real-time Prices**: `/api/real-time/{symbol}`
- **Intraday Data**: `/api/intraday/{symbol}`
- **Bulk EOD Data**: `/api/eod-bulk-last-day/{exchange}`

### 2. Technical Indicators

Over 100 indicators including:
- **Trend**: SMA, EMA, WMA, DEMA, TEMA, T3, KAMA
- **Momentum**: RSI, MACD, STOCH, WILLR, ADX, AROON
- **Volatility**: BBANDS, ATR, TRANGE, KELTNER
- **Volume**: OBV, AD, MFI, CMF, VWAP

### 3. Fundamental Data

- **Company Overview**: `/api/fundamentals/{symbol}`
- **Financial Statements**: Income, balance sheet, cash flow
- **Ratios & Metrics**: PE, PB, ROE, debt ratios
- **Analyst Ratings**: Recommendations, price targets

### 4. Advanced Features

- **Options Data**: `/api/options/{symbol}`
- **News & Sentiment**: `/api/news`
- **Market Screener**: `/api/screener`
- **Economic Calendar**: `/api/economic-events`
- **IPO Calendar**: `/api/ipo`

## TypeScript Integration

All endpoints have corresponding TypeScript interfaces:

```typescript
import { 
  EODPrice, 
  LivePrice, 
  TechnicalIndicator,
  FundamentalData,
  OptionsChain 
} from '@/types/eodhd';
```

## Testing

Comprehensive test suite available:

```bash
# Run all EODHD tests
npm run test:eodhd

# Test specific endpoints
npm run test:eodhd -- --grep "market-data"
```

## Performance Optimization

- Request batching for bulk operations
- Intelligent caching strategies
- WebSocket connection pooling
- Parallel request optimization

## THub V2 Integration

This documentation includes specific patterns for THub V2's:
- 3-layer convergence analysis
- Signal generation pipeline
- Real-time monitoring
- Performance optimization

## Support

- **Official Docs**: https://eodhd.com/financial-apis/
- **API Status**: https://status.eodhd.com/
- **Support Email**: support@eodhd.com

## Version

Documentation Version: 1.0.0
Last Updated: January 2025
API Version: v1

---

For detailed endpoint documentation, see the specific category folders in `/endpoints/`.