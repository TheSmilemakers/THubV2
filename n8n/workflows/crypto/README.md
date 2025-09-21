# Crypto Workflows

This folder contains n8n workflows for cryptocurrency market analysis and signal generation.

## Workflows

### crypto-bot-updated.json
**Version**: 2.0.0  
**Status**: Ready for import  
**Schedule**: Every 4 hours

#### Key Features
- **Smart Filtering**: Fetches 150 coins but excludes stablecoins (USDT, USDC, DAI), wrapped tokens (WBTC, WETH), and bridged versions
- **Sentiment Integration**: Fear & Greed Index fetched in parallel and integrated BEFORE analysis
- **3-Layer Analysis**:
  - Technical Analysis (30%): Support/resistance, momentum, volume
  - Sentiment Alignment (30%): Fear & Greed correlation with price action
  - Volume Analysis (20%): Liquidity and whale activity detection
  - Market Position (20%): Rank and ATH/ATL distances
- **Enhanced Indicators**: RSI calculation, whale activity scoring, risk assessment
- **Dual Output**: Sends to THub webhook AND Google Sheets for redundancy

#### Improvements Made
1. **Efficient API Usage**: Fear & Greed called once (not per coin)
2. **Better Coin Selection**: Top 50 tradeable coins only (no stables/wrapped)
3. **Early Sentiment**: All coins get sentiment data before filtering
4. **Webhook Integration**: Ready to send to Supabase via THub API

#### Required Environment Variables
```bash
# For webhook integration
THUB_WEBHOOK_URL=http://localhost:3000  # or production URL
CRYPTO_WEBHOOK_SECRET=your-secret-key

# Google Sheets credentials configured in n8n
```

#### Data Flow
```
Schedule (4h) → 
├─→ Get Market Data (150 coins)
│   └─→ Filter Exclusions → Limit to 50
└─→ Get Fear & Greed Index
    │
    └─→ Merge Sentiment with all 50 coins
        └─→ Technical Analysis (with sentiment)
            └─→ Filter Buy Signals
                └─→ Enhanced Analysis (RSI, Whale)
                    └─→ Sort by Score
                        └─→ Top 10
                            └─→ Format
                                ├─→ THub Webhook
                                └─→ Google Sheets
```

## Import Instructions

1. Open n8n interface
2. Go to Workflows → Import
3. Select `crypto-bot-updated.json`
4. Configure credentials:
   - Google Sheets (if using)
   - Set environment variables for webhook
5. Test with manual trigger before activating

## Webhook Endpoint

The workflow sends to `/api/webhooks/crypto` with this structure:

```json
{
  "signals": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "current_price": 50000,
      "final_score": 85,
      "recommendation": "STRONG BUY",
      "risk_level": "MEDIUM",
      // ... 30+ additional fields
    }
  ],
  "metadata": {
    "source": "n8n-crypto-bot",
    "version": "2.0",
    "timestamp": "2025-01-20T..."
  }
}
```

## Customization

### Adjust Filtering
Edit the "Filter Exclusions" node to add/remove token patterns.

### Change Scoring Weights
Edit "Technical Analysis" node to adjust the scoring formula:
- Technical: 30%
- Sentiment: 30%
- Volume: 20%
- Momentum: 20%

### Modify Schedule
Edit "Schedule Trigger" node to change frequency (default: 4 hours).

## Troubleshooting

**No signals generated**: 
- Check if market conditions are too bearish
- Verify Fear & Greed API is responding
- Lower the filter threshold from 70 to 60

**Too many signals**: 
- Increase filter threshold to 80+
- Add more restrictive conditions in Filter Buy Signals

**API errors**:
- CoinGecko has rate limits (50 calls/min free tier)
- Consider adding delays between executions
- Check API key if using paid tier