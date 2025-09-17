# n8n Workflow Configuration for THub V2

This directory contains the n8n workflow configurations for THub V2's automated market scanning and signal generation system.

> **🚀 Quick Start**: See `README-INDEX.md` for the recommended setup path and `LOCAL-TESTING-GUIDE.md` to start testing immediately without deployment.

## Overview

The n8n workflows automate the following processes:
- **Market Scanning**: Scans 11,000+ US stocks every 30 minutes
- **Adaptive Filtering**: Adjusts parameters based on market conditions
- **Batch Analysis**: Processes top candidates through 3-layer convergence
- **Signal Monitoring**: Tracks active signals and alerts on changes
- **Pre-Market Scanning**: Identifies gap opportunities before market open

## Directory Structure

```
n8n/
├── workflows/
│   ├── core/                 # Essential workflows
│   │   ├── market-scanner-adaptive.json
│   │   ├── batch-analysis-priority.json
│   │   └── signal-monitor-realtime.json
│   ├── advanced/             # Enhanced workflows
│   │   └── pre-market-scanner.json
│   └── monitoring/           # Performance tracking
├── config/                   # Configuration modules
│   └── adaptive-filters.js   # Dynamic filter logic
├── test-payloads/           # Test data for validation
└── README.md                # This file
```

## Quick Start

### 1. Environment Setup

Ensure these environment variables are set in your n8n instance:

```bash
# Application URL (choose based on your setup)
APP_URL=http://localhost:3000              # For local testing
# OR
APP_URL=https://xxxxx.ngrok.io            # For ngrok tunnel
# OR  
APP_URL=https://your-app.vercel.app       # For production

# Webhook Authentication (always the same)
N8N_WEBHOOK_SECRET=thub_v2_webhook_secret_2024_secure_key

# Optional: Notification channels
SLACK_WEBHOOK_URL=your-slack-webhook
PERFORMANCE_SHEET_ID=your-google-sheet-id
```

### 2. Import Workflows

1. Open your n8n instance
2. Go to Workflows → Import
3. Import each JSON file from the `workflows/` directory
4. Configure credentials (see below)

### 3. Configure Credentials

Create a credential named `n8n Webhook Auth` with:
- Type: Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer thub_v2_webhook_secret_2024_secure_key`

### 4. Test Workflows

#### Local Testing First (Recommended)

1. **Start your backend:**
   ```bash
   cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
   npx pnpm dev
   ```

2. **Run the test script:**
   ```bash
   ./test-local-setup.sh
   ./n8n/test-workflows.sh scan-small
   ```

3. **Or test manually:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/n8n \
     -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "market_scan",
       "filters": {
         "limit": 5,
         "minVolume": 1000000
       }
     }'
   ```

See `LOCAL-TESTING-GUIDE.md` for complete local testing instructions including ngrok setup.

## Workflow Descriptions

### 1. Market Scanner Adaptive (`market-scanner-adaptive.json`)

**Purpose**: Main workflow for market-wide opportunity discovery

**Schedule**: Every 30 minutes (9:30 AM - 4:00 PM EST)

**Key Features**:
- Checks market status before scanning
- Applies adaptive filters based on VIX/volume
- Quality control removes suspicious results
- Queues top candidates for analysis
- Notifies on high-value discoveries

**Adaptive Logic**:
- High volatility (VIX > 25): Stricter filters, more candidates
- Low volatility (VIX < 15): Relaxed filters, fewer candidates
- Power hour (3:00 PM): Focus on momentum

### 2. Batch Analysis Priority (`batch-analysis-priority.json`)

**Purpose**: Analyzes queued candidates through 3-layer convergence

**Trigger**: Webhook from market scanner or manual

**Key Features**:
- Priority sorting by opportunity score
- Parallel processing in batches of 10
- Aggregates results across batches
- Alerts on signals with score >= 70

### 3. Pre-Market Gap Scanner (`pre-market-scanner.json`)

**Purpose**: Identifies gap opportunities before market open

**Schedule**: 8:30 AM EST (weekdays)

**Key Features**:
- Lower volume thresholds for pre-market
- Higher change threshold (5%+) for gaps
- Categorizes gaps by strength
- Urgent analysis for extreme gaps

### 4. Signal Monitor Real-time (`signal-monitor-realtime.json`)

**Purpose**: Monitors active signals for changes

**Schedule**: Every 15 minutes

**Key Features**:
- Retrieves active signals via market_overview
- Identifies stale signals (>3 days)
- Tracks high-value signals (score >= 80)
- Logs performance metrics

## Testing Guide

### Phase 1: Component Testing

1. **Test Webhook Endpoint**:
   ```bash
   # Health check
   curl http://localhost:3000/api/webhooks/n8n
   ```

2. **Test Market Scan (Small)**:
   ```bash
   # Use test payload
   cat test-payloads/market-scan-test.json | jq '.test_cases[0].payload'
   ```

3. **Verify Database**:
   - Check `market_scan_queue` table
   - Verify `market_scan_history` entries

### Phase 2: Workflow Testing

1. **Manual Execution**:
   - Open workflow in n8n
   - Click "Execute Workflow"
   - Check all nodes turn green

2. **Monitor Results**:
   - Check execution history
   - Verify data flow between nodes
   - Review error handling

### Phase 3: Integration Testing

1. **End-to-End Test**:
   - Trigger market scan
   - Verify candidates queued
   - Check batch analysis runs
   - Confirm signals created

2. **Performance Validation**:
   - Scan time < 4 minutes
   - 20-30 candidates found
   - 3-5 signals generated

## Production Deployment

### 1. Staged Rollout

**Day 1**: Limited Testing
- Enable workflow with 5-symbol limit
- Manual execution only
- Monitor all results

**Day 2**: Sector Testing
- Increase limit to 100
- Focus on specific sectors
- Enable hourly schedule

**Day 3**: Full Market
- Remove symbol limit
- Enable 30-minute schedule
- Monitor API usage

**Week 2**: Adaptive Features
- Enable VIX-based filtering
- Activate pre-market scanner
- Add power hour focus

### 2. Monitoring Setup

Track these metrics:
- **Execution Time**: Target < 4 minutes
- **Candidates Found**: Target 20-30
- **Signals Generated**: Target 3-5
- **Error Rate**: Target < 5%
- **API Usage**: Stay under 80%

### 3. Alert Configuration

Set up notifications for:
- Workflow failures
- No candidates found (3x consecutive)
- API limit warnings
- High-value signals (score >= 80)

## Troubleshooting

### Common Issues

1. **No Candidates Found**
   - Check market hours
   - Verify filters aren't too restrictive
   - Ensure EODHD API key is valid

2. **Timeout Errors**
   - Reduce batch size
   - Increase timeout settings
   - Check API rate limits

3. **Authentication Failures**
   - Verify webhook secret matches
   - Check credential configuration
   - Ensure Bearer prefix included

### Debug Mode

Enable detailed logging:
1. Add console.log in Code nodes
2. Check n8n execution details
3. Review application logs

## Advanced Configuration

### Custom Scoring Weights

Modify in `adaptive-filters.js`:
```javascript
weights: {
  volume: 30,    // Adjust 0-100
  momentum: 40,  // Adjust 0-100
  liquidity: 30  // Adjust 0-100
}
```

### Market Condition Overrides

For testing specific conditions:
```javascript
marketConditions: {
  vix: 35,        // Force high volatility
  trend: 'risk-off',
  volume: 30000000
}
```

## Performance Optimization

1. **Caching Strategy**
   - 5-minute cache for bulk EOD data
   - Reduces redundant API calls
   - Warm cache before market open

2. **Parallel Processing**
   - Batch size: 10 symbols
   - Concurrent executions: 3
   - Queue management prevents overload

3. **Database Optimization**
   - Index on opportunity_score
   - Partition by date for history
   - Regular cleanup of old data

## Future Enhancements

1. **Machine Learning Integration**
   - Pattern recognition from successful signals
   - Dynamic weight adjustment
   - Predictive filtering

2. **Real-time Price Updates**
   - WebSocket integration
   - Stop loss monitoring
   - Take profit alerts

3. **Advanced Analytics**
   - Sector rotation detection
   - Correlation analysis
   - Market regime identification

## Support

For issues or questions:
1. Check workflow execution history
2. Review application logs
3. Verify all credentials configured
4. Test with small batches first

Remember: Quality over speed - properly configured automation will generate signals 24/7!