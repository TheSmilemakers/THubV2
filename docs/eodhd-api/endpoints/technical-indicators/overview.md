# Technical Indicators API Overview

## Endpoint: `/api/technical/{symbol}`

The Technical Indicators API provides access to 100+ technical analysis indicators. Each indicator request consumes 5 API calls.

## 🎯 Base URL
```
https://eodhd.com/api/technical/{symbol}
```

## 📊 Available Indicators

### Momentum Indicators

#### 1. RSI (Relative Strength Index)
```typescript
// Parameters
function: 'rsi'
period: number = 14  // default: 50

// Response
interface RSIData {
  date: string;
  value: number;
}
```

#### 2. MACD (Moving Average Convergence Divergence)
```typescript
// Parameters
function: 'macd'
fast_period: number = 12
slow_period: number = 26
signal_period: number = 9

// Response
interface MACDData {
  date: string;
  macd: number;
  macd_signal: number;
  macd_hist: number;
}
```

#### 3. Stochastic Oscillator
```typescript
// Parameters
function: 'stochastic'
fast_k_period: number = 14
slow_k_period: number = 3
slow_d_period: number = 3

// Response
interface StochasticData {
  date: string;
  slow_k: number;
  slow_d: number;
}
```

#### 4. CCI (Commodity Channel Index)
```typescript
// Parameters
function: 'cci'
period: number = 20

// Response
interface CCIData {
  date: string;
  value: number;
}
```

#### 5. Williams %R
```typescript
// Parameters
function: 'williams_r'
period: number = 14

// Response
interface WilliamsRData {
  date: string;
  value: number;
}
```

#### 6. ROC (Rate of Change)
```typescript
// Parameters
function: 'roc'
period: number = 10

// Response
interface ROCData {
  date: string;
  value: number;
}
```

### Trend Indicators

#### 7. SMA (Simple Moving Average)
```typescript
// Parameters
function: 'sma'
period: number = 20

// Response
interface SMAData {
  date: string;
  value: number;
}
```

#### 8. EMA (Exponential Moving Average)
```typescript
// Parameters
function: 'ema'
period: number = 20

// Response
interface EMAData {
  date: string;
  value: number;
}
```

#### 9. WMA (Weighted Moving Average)
```typescript
// Parameters
function: 'wma'
period: number = 20

// Response
interface WMAData {
  date: string;
  value: number;
}
```

#### 10. TEMA (Triple Exponential Moving Average)
```typescript
// Parameters
function: 'tema'
period: number = 20

// Response
interface TEMAData {
  date: string;
  value: number;
}
```

#### 11. ADX (Average Directional Index)
```typescript
// Parameters
function: 'adx'
period: number = 14

// Response
interface ADXData {
  date: string;
  adx: number;
  plus_di: number;
  minus_di: number;
}
```

#### 12. DMI (Directional Movement Index)
```typescript
// Parameters
function: 'dmi'
period: number = 14

// Response
interface DMIData {
  date: string;
  plus_di: number;
  minus_di: number;
}
```

#### 13. Parabolic SAR
```typescript
// Parameters
function: 'sar'
acceleration: number = 0.02
maximum: number = 0.2

// Response
interface SARData {
  date: string;
  value: number;
}
```

### Volatility Indicators

#### 14. Bollinger Bands
```typescript
// Parameters
function: 'bbands'
period: number = 20
std_dev: number = 2

// Response
interface BollingerBandsData {
  date: string;
  upper: number;
  middle: number;
  lower: number;
}
```

#### 15. ATR (Average True Range)
```typescript
// Parameters
function: 'atr'
period: number = 14

// Response
interface ATRData {
  date: string;
  value: number;
}
```

#### 16. Standard Deviation
```typescript
// Parameters
function: 'stddev'
period: number = 20

// Response
interface StdDevData {
  date: string;
  value: number;
}
```

#### 17. Volatility
```typescript
// Parameters
function: 'volatility'
period: number = 20

// Response
interface VolatilityData {
  date: string;
  value: number;
}
```

### Volume Indicators

#### 18. Average Volume
```typescript
// Parameters
function: 'avgvol'
period: number = 20

// Response
interface AvgVolData {
  date: string;
  value: number;
}
```

#### 19. Average Volume by Price
```typescript
// Parameters
function: 'avgvolccy'
period: number = 20

// Response
interface AvgVolCcyData {
  date: string;
  value: number;
}
```

### Additional Indicators

#### 20. Beta
```typescript
// Parameters
function: 'beta'
symbol: string  // Compare against symbol
period: number = 252

// Response
interface BetaData {
  date: string;
  value: number;
}
```

#### 21. Slope (Linear Regression)
```typescript
// Parameters
function: 'slope'
period: number = 20

// Response
interface SlopeData {
  date: string;
  value: number;
}
```

#### 22. Stochastic RSI
```typescript
// Parameters
function: 'stochrsi'
period: number = 14
fast_k_period: number = 5
fast_d_period: number = 3

// Response
interface StochRSIData {
  date: string;
  fast_k: number;
  fast_d: number;
}
```

## 🔧 Common Parameters

All technical indicator endpoints share these common parameters:

```typescript
interface TechnicalIndicatorParams {
  api_token: string;      // Required: Your API key
  function: string;       // Required: Indicator function name
  period?: number;        // Optional: Lookback period (default: 50)
  from?: string;         // Optional: Start date (YYYY-MM-DD)
  to?: string;           // Optional: End date (YYYY-MM-DD)
  order?: 'a' | 'd';     // Optional: Ascending or descending
  fmt?: 'json' | 'csv';  // Optional: Output format (default: json)
  splitadjusted?: boolean; // Optional: Apply split adjustments
  filter?: 'last';       // Optional: Get only last value
}
```

## 📡 Example Requests

### Basic RSI Request
```bash
GET https://eodhd.com/api/technical/AAPL.US?api_token=demo&function=rsi&period=14
```

### MACD with Custom Periods
```bash
GET https://eodhd.com/api/technical/AAPL.US?api_token=demo&function=macd&fast_period=12&slow_period=26&signal_period=9
```

### Multiple Indicators (Separate Requests)
```typescript
// Each indicator requires a separate API call
const rsi = await eodhd.getRSI('AAPL.US', 14);
const macd = await eodhd.getMACD('AAPL.US', 12, 26, 9);
const bb = await eodhd.getBollingerBands('AAPL.US', 20, 2);
```

## ⚡ Performance Considerations

1. **API Cost**: Each technical indicator request consumes 5 API calls
2. **Caching**: Technical indicators for historical data can be cached indefinitely
3. **Batch Processing**: Consider calculating multiple timeframes in one request
4. **Last Value**: Use `filter=last` to get only the most recent value

## 🎯 THub V2 Integration

For THub V2's 3-layer convergence analysis, key indicators include:

### Technical Layer (40% weight)
- RSI for momentum
- MACD for trend confirmation
- Bollinger Bands for volatility
- ADX for trend strength
- Volume indicators for liquidity

### Suggested Indicator Combinations
```typescript
// Momentum + Trend
const signals = {
  momentum: await eodhd.getRSI(symbol, 14),
  trend: await eodhd.getMACD(symbol),
  strength: await eodhd.getADX(symbol, 14),
  volatility: await eodhd.getBollingerBands(symbol)
};
```

## 🚨 Important Notes

1. **Split Adjustments**: Use `splitadjusted=true` for accurate historical calculations
2. **Date Ranges**: Indicators need sufficient historical data for calculation
3. **Missing Data**: Some indicators may have fewer data points due to calculation requirements
4. **API Limits**: Plan indicator usage carefully due to 5x API cost

## 📚 Additional Resources

- [Indicator Formulas Reference](./formulas.md)
- [Integration Examples](../../examples/technical-indicators.ts)
- [TypeScript Interfaces](../../types/technical.types.ts)
- [Performance Optimization Guide](./optimization.md)

---

*Note: This list includes confirmed indicators. EODHD continuously adds new indicators. Check the official documentation for the latest additions.*
*Last Updated: January 19, 2025*