# End-of-Day (EOD) Historical Data API

## Endpoint: `/api/eod/{symbol}`

The EOD Historical Data API provides daily price data for stocks, ETFs, indices, and other instruments. Data for US stocks is available from inception, while non-US exchanges are covered from January 3, 2000.

## 🎯 Base URL
```
https://eodhd.com/api/eod/{symbol}
```

## 📋 Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_token` | string | Yes | - | Your API key or 'demo' |
| `from` | string | No | 1 year ago | Start date (YYYY-MM-DD) |
| `to` | string | No | today | End date (YYYY-MM-DD) |
| `period` | string | No | 'd' | Period: 'd' (daily), 'w' (weekly), 'm' (monthly) |
| `order` | string | No | 'a' | Order: 'a' (ascending), 'd' (descending) |
| `fmt` | string | No | 'json' | Format: 'json' or 'csv' |
| `filter` | string | No | - | Filter options: 'last_close' |

## 📊 Response Format

### Standard Response
```json
[
  {
    "date": "2024-01-19",
    "open": 182.16,
    "high": 183.97,
    "low": 180.31,
    "close": 182.68,
    "adjusted_close": 182.68,
    "volume": 65712481
  }
]
```

### TypeScript Interface
```typescript
interface EODData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}
```

### Filter Options

#### Last Close Only
Using `filter=last_close` returns only the closing price:
```json
182.68
```

## 📡 Example Requests

### Basic EOD Data (Last Year)
```bash
GET https://eodhd.com/api/eod/AAPL.US?api_token=demo&fmt=json
```

### Specific Date Range
```bash
GET https://eodhd.com/api/eod/AAPL.US?api_token=demo&from=2024-01-01&to=2024-01-31&fmt=json
```

### Weekly Data
```bash
GET https://eodhd.com/api/eod/AAPL.US?api_token=demo&period=w&fmt=json
```

### Last Close Price Only
```bash
GET https://eodhd.com/api/eod/AAPL.US?api_token=demo&filter=last_close&fmt=json
```

## 🔄 Symbol Formats

### US Stocks
- Format: `{TICKER}.US` or `{TICKER}.{EXCHANGE}`
- Examples: `AAPL.US`, `MSFT.NASDAQ`, `BRK-B.US`

### International Stocks
- Format: `{TICKER}.{EXCHANGE_CODE}`
- Examples: `AAPL.LSE`, `BMW.XETRA`, `7203.TSE`

### Indices
- Format: `{INDEX}.INDX`
- Examples: `GSPC.INDX` (S&P 500), `DJI.INDX` (Dow Jones)

### ETFs
- Same as stocks: `SPY.US`, `QQQ.US`

## 💡 Usage Examples

### JavaScript/TypeScript
```typescript
async function getHistoricalData(symbol: string, days: number = 30): Promise<EODData[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const params = new URLSearchParams({
    api_token: process.env.EODHD_API_KEY,
    from: fromDate.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    fmt: 'json'
  });
  
  const response = await fetch(
    `https://eodhd.com/api/eod/${symbol}?${params}`
  );
  
  return response.json();
}

// Usage
const data = await getHistoricalData('AAPL.US', 30);
```

### Python
```python
import requests
from datetime import datetime, timedelta

def get_historical_data(symbol, days=30):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    params = {
        'api_token': 'demo',
        'from': start_date.strftime('%Y-%m-%d'),
        'to': end_date.strftime('%Y-%m-%d'),
        'fmt': 'json'
    }
    
    url = f'https://eodhd.com/api/eod/{symbol}'
    response = requests.get(url, params=params)
    
    return response.json()

# Usage
data = get_historical_data('AAPL.US', 30)
```

## ⚡ Performance Optimization

### 1. Efficient Date Ranges
```typescript
// Good: Get only needed data
const data = await getEOD('AAPL.US', '2024-01-01', '2024-01-31');

// Bad: Get all historical data when you need only recent
const data = await getEOD('AAPL.US'); // Gets 1 year by default
```

### 2. Caching Strategy
```typescript
class EODCache {
  private cache = new Map<string, EODData[]>();
  
  async getEOD(symbol: string, from: string, to: string) {
    const key = `${symbol}:${from}:${to}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const data = await fetchEOD(symbol, from, to);
    this.cache.set(key, data);
    
    return data;
  }
}
```

### 3. Bulk Processing
For multiple symbols, consider using the bulk endpoint instead of individual requests.

## 🎯 THub V2 Integration

### Technical Analysis Layer
```typescript
// Get historical data for technical analysis
const historicalData = await eodhd.getHistoricalData('AAPL.US', 60);

// Calculate custom indicators
const prices = historicalData.map(d => d.close);
const sma20 = calculateSMA(prices, 20);
const rsi = calculateRSI(prices, 14);
```

### Data Enrichment Service
```typescript
interface EnrichedEODData extends EODData {
  change: number;
  changePercent: number;
  rangePercent: number; // (high-low)/close
  volumeAvg20: number;
}

function enrichEODData(data: EODData[]): EnrichedEODData[] {
  return data.map((day, index) => {
    const prevClose = index > 0 ? data[index - 1].close : day.open;
    
    return {
      ...day,
      change: day.close - prevClose,
      changePercent: ((day.close - prevClose) / prevClose) * 100,
      rangePercent: ((day.high - day.low) / day.close) * 100,
      volumeAvg20: calculateAverage(
        data.slice(Math.max(0, index - 19), index + 1)
          .map(d => d.volume)
      )
    };
  });
}
```

## 🚨 Important Notes

1. **Adjusted Close**: Always use `adjusted_close` for calculations to account for splits and dividends
2. **Volume**: Volume is the actual number of shares traded (not in thousands)
3. **Missing Data**: Markets closed on weekends and holidays won't have data
4. **Time Zones**: All dates are in the exchange's local time zone
5. **API Cost**: Each request consumes 1 API call

## 🔍 Common Issues & Solutions

### Issue: No data returned
```typescript
// Check symbol format
const symbol = ticker.includes('.') ? ticker : `${ticker}.US`;

// Verify date range
if (new Date(from) > new Date(to)) {
  throw new Error('Start date must be before end date');
}
```

### Issue: Incomplete data
```typescript
// Markets may be closed - check trading calendar
const tradingDays = data.filter(d => d.volume > 0);
```

## 📚 Related Endpoints

- [Real-time Quotes](./real-time.md) - Current prices
- [Intraday Data](./intraday.md) - Minute-level data
- [Bulk EOD](./bulk.md) - Multiple symbols at once

## 🔗 External Resources

- [Official EOD API Docs](https://eodhd.com/financial-apis/api-for-historical-data-and-volumes)
- [Trading Calendar API](../reference-data/trading-hours.md)
- [Symbol Search](../reference-data/symbol-search.md)

---

*Last Updated: January 19, 2025*
*API Version: v1*