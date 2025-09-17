# THub V2 Production n8n Workflows

This directory contains the production n8n workflows for THub V2, exported on January 2025.

## Workflows Overview

### 1. Market Scanner (PRODUCTION)
- **File**: `market-scanner-production.json`
- **ID**: `fPC0yQPZZGK0nDyc`
- **Schedule**: Every 30 minutes during market hours (9:30 AM - 4:00 PM EST)
- **Purpose**: 
  - Checks if market is open (time and weekday validation)
  - Fetches VIX for market volatility assessment
  - Applies adaptive filters based on market conditions
  - Executes market scan via THub V2 webhook
- **Key Features**:
  - VIX-based adaptive filtering (adjusts volume requirements and limits)
  - Time-of-day adjustments (opening hour, midday, power hour)
  - Error handling and retry logic
  - Logs success/failure for monitoring

### 2. Batch Analysis (PRODUCTION)
- **File**: `batch-analysis-production.json`
- **ID**: `eEX7Vp4D8B2BYUwO`
- **Trigger**: Webhook at path `/batch-analysis-trigger`
- **Purpose**: Process batch analysis requests for multiple symbols
- **Key Features**:
  - Accepts up to 50 symbols per batch
  - Priority-based processing (normal/high)
  - Request ID tracking for async operations
  - Returns immediate response with request ID

### 3. Signal Monitor (PRODUCTION)
- **File**: `signal-monitor-production.json`
- **ID**: `Vsm1O5ROZxCTKIBh`
- **Schedule**: Every 15 minutes
- **Purpose**: Monitor active signals and identify those needing refresh
- **Key Features**:
  - Fetches signals with score >= 70
  - Categorizes signals (strong 80+, moderate 70-79)
  - Identifies stale signals (>4 hours old)
  - Flags high-value signals for refresh after 1 hour
  - Provides summary statistics and top 5 signals

### 4. Webhook Test (DEPLOY READY)
- **File**: `webhook-test-deploy-ready.json`
- **ID**: `RJGPBPJ7Cdf652Tz`
- **Trigger**: Webhook at path `/test-webhook`
- **Purpose**: Test webhook connectivity and API authentication
- **Key Features**:
  - Receives test webhook data
  - Makes API call to THub V2 webhook endpoint
  - Validates authentication and connectivity
  - Returns success/error response with details

### 5. Webhook Test (Simple)
- **File**: `webhook-test-simple.json`
- **ID**: `hnxMm9Ukaoah3xte`
- **Trigger**: Webhook at path `/thub-test`
- **Purpose**: Simple webhook test for basic connectivity
- **Key Features**:
  - Minimal webhook test
  - Mock response for market_scan action
  - Direct JSON response
  - No external API calls

## Webhook URLs

All webhooks follow the pattern:
```
https://n8n.anikamaher.com/webhook/{webhook-path}
```

- Batch Analysis: `https://n8n.anikamaher.com/webhook/batch-analysis-trigger`
- Test Webhook (Deploy Ready): `https://n8n.anikamaher.com/webhook/test-webhook`
- Test Webhook (Simple): `https://n8n.anikamaher.com/webhook/thub-test`

## API Endpoints

All workflows communicate with THub V2 via:
- **URL**: `https://www.thub.rajanmaher.com/api/webhooks/n8n`
- **Method**: POST
- **Authentication**: HTTP Header Auth (credential: "THub V2 Webhook Auth")

## Credentials

The workflows use the following credential:
- **Name**: "THub V2 Webhook Auth"
- **ID**: `NhunubX0SoPRJUtu`
- **Type**: HTTP Header Authentication

## Actions Supported

The THub V2 webhook endpoint supports these actions:
- `market_scan` - Execute market scanning with filters
- `batch_analyze` - Analyze multiple symbols
- `get_active_signals` - Retrieve active signals
- `market_overview` - Get market overview (test)

## Environment Configuration

- **Timezone**: America/New_York
- **Execution Order**: v1
- **Save Manual Executions**: true (enabled for debugging)

## Import Instructions

To import these workflows into n8n:

1. Open n8n interface
2. Go to Workflows
3. Click "Import"
4. Select the JSON file
5. Review and activate as needed
6. Update credentials if necessary

## Testing

Use the webhook test workflows to verify:
1. n8n webhook reception
2. THub V2 API connectivity
3. Authentication configuration
4. Response handling

## Monitoring

- Market Scanner logs success/failure for each run
- Signal Monitor provides statistics every 15 minutes
- Check n8n execution history for debugging
- All workflows include console.log statements for tracking

## Last Updated

These workflows were exported on: **January 2025**

- Market Scanner: Updated 2025-09-17T18:04:46.567Z
- Batch Analysis: Updated 2025-09-17T17:39:29.023Z
- Signal Monitor: Updated 2025-09-17T17:41:32.359Z
- Webhook Test (Deploy): Updated 2025-09-17T18:00:44.718Z
- Webhook Test (Simple): Updated 2025-08-08T22:32:37.843Z