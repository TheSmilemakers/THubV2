# EODHD API Endpoints Inventory

## Complete Endpoint Documentation

This directory contains detailed documentation for all EODHD API endpoints, organized by category. Each endpoint includes parameters, response formats, TypeScript interfaces, and usage examples.

## 📊 Endpoint Categories

### 1. [Market Data](./market-data/) - Core Price Data
- **EOD Historical Data** (`/api/eod/{symbol}`)
- **Real-time Quote** (`/api/real-time/{symbol}`)
- **Intraday Data** (`/api/intraday/{symbol}`)
- **Live/Delayed Quotes** (`/api/quote-delayed/{symbol}`)
- **Bulk EOD Data** (`/api/eod-bulk-last-day/{exchange}`)
- **Tick Data** (`/api/tick/{symbol}`)

### 2. [Technical Indicators](./technical-indicators/) - 100+ Indicators
- **Momentum Indicators** (RSI, MACD, Stochastic, CCI, Williams %R, ROC)
- **Trend Indicators** (SMA, EMA, WMA, TEMA, ADX, Aroon, PSAR)
- **Volatility Indicators** (Bollinger Bands, ATR, Keltner Channels, Donchian)
- **Volume Indicators** (OBV, CMF, MFI, VWAP, Volume Profile)
- **Advanced Indicators** (Ichimoku, Pivot Points, Fibonacci, Beta)

### 3. [Fundamentals](./fundamentals/) - Company Data
- **Company Profile** (`/api/fundamentals/{symbol}`)
- **Financial Statements** (Income, Balance Sheet, Cash Flow)
- **Earnings & Ratios** (PE, PB, ROE, Debt/Equity)
- **ESG Data** (`/api/esg/{symbol}`)
- **Insider Transactions** (`/api/insider-transactions/{symbol}`)

### 4. [Options](./options/) - Derivatives Data
- **Options Chain** (`/api/options/{symbol}`)
- **Historical Options** (`/api/options-historical/{symbol}`)
- **Options by Strike** (`/api/options/strike/{symbol}`)
- **Options by Expiration** (`/api/options/expiration/{symbol}`)
- **Greeks & IV** (included in chain data)

### 5. [News & Sentiment](./news-sentiment/) - Market Sentiment
- **Financial News** (`/api/news`)
- **News by Symbol** (`/api/news/{symbol}`)
- **Sentiment Analysis** (`/api/sentiment/{symbol}`)
- **Trending Topics** (`/api/trending`)

### 6. [Screener](./screener/) - Market Screening
- **Stock Screener** (`/api/screener`)
- **Pre-built Screens** (`/api/screener/signals`)
- **Custom Filters** (market cap, PE, volume, etc.)
- **Technical Signals** (new highs/lows, breakouts)

### 7. [Reference Data](./reference-data/) - Market Info
- **Exchanges List** (`/api/exchanges-list`)
- **Exchange Symbols** (`/api/exchange-symbol-list/{exchange}`)
- **Symbol Search** (`/api/search/{query}`)
- **Trading Hours** (`/api/exchange-details/{exchange}`)
- **Market Holidays** (`/api/holidays/{exchange}`)

### 8. [WebSockets](./websockets/) - Real-time Streaming
- **WebSocket Connection** (`wss://ws.eodhd.com`)
- **Subscription Management**
- **Real-time Price Updates**
- **Trade & Quote Events**

## 📈 API Statistics

| Category | Endpoints | Implementation Status |
|----------|-----------|----------------------|
| Market Data | 6 | 3 implemented ✅ |
| Technical Indicators | 100+ | 5 implemented ✅ |
| Fundamentals | 5 | 0 implemented ❌ |
| Options | 4 | 0 implemented ❌ |
| News & Sentiment | 4 | 0 implemented ❌ |
| Screener | 3 | 0 implemented ❌ |
| Reference Data | 5 | 0 implemented ❌ |
| WebSockets | 1 | 0 implemented ❌ |
| **Total** | **128+** | **8 implemented (6%)** |

## 🔑 Common Parameters

### Authentication
- `api_token` (required): Your EODHD API key or 'demo' for testing

### Data Format
- `fmt`: Output format ('json' or 'csv'), default: 'json'

### Date Ranges
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `period`: Data period ('d', 'w', 'm')

### Pagination
- `limit`: Number of results
- `offset`: Starting position

## 📝 Response Formats

All endpoints return data in JSON format by default:

```typescript
// Success Response
{
  "data": [...],
  "meta": {
    "requested": 100,
    "returned": 100
  }
}

// Error Response
{
  "error": "Invalid API key",
  "message": "Please provide a valid API token",
  "code": 401
}
```

## 🚀 Quick Navigation

- [Getting Started Guide](../README.md)
- [TypeScript Types](../types/)
- [Usage Examples](../examples/)
- [Testing Tools](../tools/)

## 📋 Implementation Checklist

- [x] Endpoint discovery complete
- [x] Basic categorization done
- [ ] Full parameter documentation
- [ ] Response format documentation
- [ ] TypeScript interfaces
- [ ] Usage examples
- [ ] Error handling guide
- [ ] Performance benchmarks

---

*This inventory is actively updated as part of the 15-day EODHD API research project.*
*Last Updated: January 19, 2025*