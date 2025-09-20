# EODHD API Complete Endpoint Inventory

## Overview

This document provides a comprehensive inventory of all EODHD API endpoints discovered through official documentation analysis. The API offers 100+ endpoints across multiple categories.

## API Base URL

```
https://eodhd.com/api
```

## Authentication

All endpoints require authentication via `api_token` parameter:
```
?api_token=YOUR_API_KEY
```

## Complete Endpoint Categories

### 1. Market Data Endpoints

#### 1.1 End-of-Day (EOD) Historical Data
- **Endpoint**: `/eod/{symbol}`
- **Method**: GET
- **Description**: Historical daily price and volume data
- **Parameters**:
  - `api_token` (required): API key
  - `fmt` (optional): 'json' or 'csv' (default: 'csv')
  - `period` (optional): 'd' (daily), 'w' (weekly), 'm' (monthly)
  - `order` (optional): 'a' (ascending), 'd' (descending)
  - `from` (optional): Start date (YYYY-MM-DD)
  - `to` (optional): End date (YYYY-MM-DD)
  - `filter` (optional): 'last_close', 'last_volume'

#### 1.2 Real-Time/Delayed Data
- **Endpoint**: `/real-time/{symbol}`
- **Method**: GET
- **Description**: Current/delayed market prices
- **Parameters**:
  - `api_token` (required): API key
  - `fmt` (optional): 'json' or 'csv'
  - `s` (optional): Multiple symbols comma-separated

#### 1.3 Intraday Historical Data
- **Endpoint**: `/intraday/{symbol}`
- **Method**: GET
- **Description**: Minute-level historical data
- **Parameters**:
  - `api_token` (required): API key
  - `interval` (optional): '1m', '5m', '15m', '30m', '1h'
  - `from` (optional): Unix timestamp
  - `to` (optional): Unix timestamp

#### 1.4 Live (Tick) Data
- **Endpoint**: `/real-time/{symbol}`
- **Method**: GET
- **Description**: Real-time tick data
- **Parameters**:
  - `api_token` (required): API key
  - `s` (optional): Multiple symbols

#### 1.5 Bulk EOD Data
- **Endpoint**: `/eod-bulk-last-day/{exchange}`
- **Method**: GET
- **Description**: All symbols for an exchange
- **Parameters**:
  - `api_token` (required): API key
  - `date` (optional): Specific date (YYYY-MM-DD)
  - `symbols` (optional): Filter specific symbols
  - `filter` (optional): 'extended' for more data

### 2. Technical Indicators (100+ indicators)

#### Base Endpoint
- **Endpoint**: `/technical/{symbol}`
- **Method**: GET
- **API Cost**: 5 API calls per request

#### Available Functions:

##### Moving Averages
1. **SMA** - Simple Moving Average
   - `function=sma`
   - `period` (default: 50)
   
2. **EMA** - Exponential Moving Average
   - `function=ema`
   - `period` (default: 50)
   
3. **WMA** - Weighted Moving Average
   - `function=wma`
   - `period` (default: 50)

##### Momentum Indicators
4. **RSI** - Relative Strength Index
   - `function=rsi`
   - `period` (default: 14)
   
5. **MACD** - Moving Average Convergence Divergence
   - `function=macd`
   - `fast_period` (default: 12)
   - `slow_period` (default: 26)
   - `signal_period` (default: 9)

6. **STOCH** - Stochastic Oscillator
   - `function=stoch`
   - `fast_k_period` (default: 14)
   - `slow_k_period` (default: 3)
   - `slow_d_period` (default: 3)

7. **STOCHRSI** - Stochastic RSI
   - `function=stochrsi`
   - `period` (default: 14)

8. **CCI** - Commodity Channel Index
   - `function=cci`
   - `period` (default: 20)

##### Volatility Indicators
9. **BBANDS** - Bollinger Bands
   - `function=bbands`
   - `period` (default: 20)
   - `std_dev` (default: 2)

10. **ATR** - Average True Range
    - `function=atr`
    - `period` (default: 14)

11. **VOLATILITY** - Historical Volatility
    - `function=volatility`
    - `period` (default: 20)

##### Trend Indicators
12. **ADX** - Average Directional Index
    - `function=adx`
    - `period` (default: 14)

13. **DMI** - Directional Movement Index
    - `function=dmi`
    - `period` (default: 14)

14. **SAR** - Parabolic SAR
    - `function=sar`
    - `acceleration` (default: 0.02)
    - `maximum` (default: 0.2)

##### Volume Indicators
15. **AVGVOL** - Average Volume
    - `function=avgvol`
    - `period` (default: 50)

16. **AVGVOLCCY** - Average Volume by Price
    - `function=avgvolccy`
    - `period` (default: 50)

##### Statistical Indicators
17. **STDDEV** - Standard Deviation
    - `function=stddev`
    - `period` (default: 20)

18. **SLOPE** - Linear Regression Slope
    - `function=slope`
    - `period` (default: 20)

19. **BETA** - Beta Coefficient
    - `function=beta`
    - `period` (default: 60)

### 3. Fundamental Data

#### 3.1 Company Fundamentals
- **Endpoint**: `/fundamentals/{symbol}`
- **Method**: GET
- **Description**: Complete fundamental data
- **Parameters**:
  - `api_token` (required): API key
  - `filter` (optional): Specific data fields

#### 3.2 ETF Fundamentals
- **Endpoint**: `/fundamentals/{symbol}`
- **Method**: GET
- **Description**: ETF holdings and details
- **Note**: Same endpoint, different response for ETFs

#### 3.3 Mutual Fund Fundamentals
- **Endpoint**: `/fundamentals/{symbol}`
- **Method**: GET
- **Description**: Mutual fund data

#### 3.4 Index Constituents
- **Endpoint**: `/fundamentals/{index_symbol}`
- **Method**: GET
- **Description**: Index components

### 4. Options Data

#### 4.1 Options Chain
- **Endpoint**: `/options/{symbol}`
- **Method**: GET
- **Description**: Complete options chain
- **Parameters**:
  - `api_token` (required): API key
  - `from` (optional): Expiration from date
  - `to` (optional): Expiration to date
  - `trade_date_from` (optional): Trade date filter
  - `trade_date_to` (optional): Trade date filter

### 5. News & Sentiment

#### 5.1 Financial News
- **Endpoint**: `/news`
- **Method**: GET
- **Description**: Market news with sentiment
- **Parameters**:
  - `api_token` (required): API key
  - `s` (optional): Symbol filter
  - `t` (optional): Tag filter
  - `from` (optional): Date from
  - `to` (optional): Date to
  - `limit` (optional): Number of results
  - `offset` (optional): Pagination

### 6. Screener API

#### 6.1 Stock Screener
- **Endpoint**: `/screener`
- **Method**: GET
- **Description**: Filter stocks by criteria
- **Parameters**:
  - `api_token` (required): API key
  - `filters` (required): JSON filter criteria
  - `signals` (optional): Technical signals
  - `sort` (optional): Sort field
  - `limit` (optional): Results limit
  - `offset` (optional): Pagination

### 7. Reference Data

#### 7.1 Exchanges List
- **Endpoint**: `/exchanges-list`
- **Method**: GET
- **Description**: All supported exchanges

#### 7.2 Exchange Symbols
- **Endpoint**: `/exchange-symbol-list/{exchange_code}`
- **Method**: GET
- **Description**: All symbols for an exchange

#### 7.3 Exchange Details
- **Endpoint**: `/exchange-details/{exchange_code}`
- **Method**: GET
- **Description**: Trading hours, holidays

#### 7.4 Search
- **Endpoint**: `/search/{query}`
- **Method**: GET
- **Description**: Symbol search

### 8. Economic Data

#### 8.1 Economic Events Calendar
- **Endpoint**: `/economic-events`
- **Method**: GET
- **Parameters**:
  - `api_token` (required): API key
  - `from` (optional): Date from
  - `to` (optional): Date to
  - `country` (optional): Country filter

#### 8.2 Macro Economic Indicators
- **Endpoint**: `/macro-indicator/{country}`
- **Method**: GET
- **Description**: GDP, inflation, etc.

### 9. Alternative Data

#### 9.1 Insider Transactions
- **Endpoint**: `/insider-transactions`
- **Method**: GET
- **Parameters**:
  - `api_token` (required): API key
  - `code` (optional): Symbol
  - `from` (optional): Date from
  - `to` (optional): Date to

#### 9.2 IPO Calendar
- **Endpoint**: `/calendar/ipos`
- **Method**: GET
- **Parameters**:
  - `api_token` (required): API key
  - `from` (optional): Date from
  - `to` (optional): Date to

#### 9.3 Earnings Calendar
- **Endpoint**: `/calendar/earnings`
- **Method**: GET
- **Parameters**:
  - `api_token` (required): API key
  - `from` (optional): Date from
  - `to` (optional): Date to
  - `symbols` (optional): Symbol filter

### 10. Cryptocurrency Data

#### 10.1 Crypto Exchanges
- **Endpoint**: `/crypto/exchanges`
- **Method**: GET

#### 10.2 Crypto Symbols
- **Endpoint**: `/crypto/symbols/{exchange}`
- **Method**: GET

#### 10.3 Crypto Fundamentals
- **Endpoint**: `/fundamentals/{crypto_symbol}`
- **Method**: GET

### 11. Bonds Data

#### 11.1 Government Bonds
- **Endpoint**: `/bonds/{country}`
- **Method**: GET
- **Description**: Government bond yields

#### 11.2 Corporate Bonds
- **Endpoint**: `/bonds/corporate/{isin}`
- **Method**: GET
- **Description**: Corporate bond data

### 12. WebSocket API

#### 12.1 Real-time WebSocket
- **Endpoint**: `wss://ws.eodhd.com/ws`
- **Protocol**: WebSocket
- **Authentication**: Send API token after connection
- **Subscriptions**:
  - `{"action": "subscribe", "symbols": "AAPL.US,MSFT.US"}`
  - `{"action": "unsubscribe", "symbols": "AAPL.US"}`

## API Response Formats

### Standard Response Headers
```json
{
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "999",
  "X-RateLimit-Reset": "1640995200"
}
```

### Error Response Format
```json
{
  "error": {
    "code": 403,
    "message": "Invalid API key"
  }
}
```

## Rate Limiting

| Endpoint Type | API Calls Consumed |
|--------------|-------------------|
| EOD Data | 1 |
| Real-time Data | 1 |
| Intraday Data | 10-100 |
| Technical Indicators | 5 |
| Fundamental Data | 5 |
| Options Data | 5-10 |
| Bulk Data | 1-100 |
| WebSocket | N/A (connection based) |

## Symbol Format

- US Stocks: `AAPL.US` or `AAPL.NASDAQ`
- International: `SYMBOL.EXCHANGE` (e.g., `BP.LSE`)
- Indices: `GSPC.INDX` (S&P 500)
- Forex: `EUR-USD.FOREX`
- Crypto: `BTC-USD.CC`

## Next Steps

1. Create TypeScript interfaces for all endpoints
2. Build comprehensive test suite
3. Document response schemas
4. Create usage examples
5. Build rate limit management system