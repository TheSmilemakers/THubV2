# n8n Setup Checklist for THub V2

Follow this checklist to configure n8n workflows for THub V2 market scanning.

## Pre-Setup Requirements

- [ ] n8n instance running and accessible (n8n.anikamaher.com)
- [ ] THub V2 backend ready (local or deployed)
- [ ] Database migrations applied (market scan tables exist)
- [ ] Environment variables configured in `.env.local`

## Local Testing Setup (Do This First!)

### Option A: Direct Local Connection
- [ ] Start backend: `npx pnpm dev`
- [ ] Test with: `./test-local-setup.sh`
- [ ] Note your local IP if needed

### Option B: ngrok Tunnel (Recommended)
- [ ] Install ngrok: `brew install ngrok`
- [ ] Start backend: `npx pnpm dev`
- [ ] Create tunnel: `ngrok http 3000`
- [ ] Copy ngrok URL: `https://xxxxx.ngrok.io`

## Step 1: Environment Configuration

### In n8n Settings
- [ ] Go to Settings → Variables
- [ ] Add the following environment variables:

```
# For local testing with ngrok:
APP_URL = https://xxxxx.ngrok.io

# For local testing on same network:
APP_URL = http://localhost:3000

# For production (after deployment):
APP_URL = https://your-app.vercel.app

# Always the same:
N8N_WEBHOOK_SECRET = thub_v2_webhook_secret_2024_secure_key

# Optional:
SLACK_WEBHOOK_URL = your-slack-webhook
PERFORMANCE_SHEET_ID = your-google-sheet-id
```

## Step 2: Create Credentials

### HTTP Header Auth Credential
- [ ] Go to Credentials → Add Credential
- [ ] Select "Header Auth"
- [ ] Name: `n8n Webhook Auth`
- [ ] Header Name: `Authorization`
- [ ] Header Value: `Bearer thub_v2_webhook_secret_2024_secure_key`
- [ ] Save

### Slack Credential (Optional)
- [ ] Add Slack OAuth2 or Webhook URL
- [ ] Test connection

### Google Sheets Credential (Optional)
- [ ] Add Google Sheets OAuth2
- [ ] Grant necessary permissions

## Step 3: Import Workflows

### Core Workflows (Required)
- [ ] Import `workflows/core/market-scanner-adaptive.json`
- [ ] Import `workflows/core/batch-analysis-priority.json`
- [ ] Import `workflows/core/signal-monitor-realtime.json`

### Advanced Workflows (Optional)
- [ ] Import `workflows/advanced/pre-market-scanner.json`
- [ ] Import `workflows/monitoring/performance-tracker.json`

### For Each Workflow
- [ ] Open workflow
- [ ] Check all nodes for red error indicators
- [ ] Update credential assignments if needed
- [ ] Save workflow

## Step 4: Test Each Workflow

### 1. Test Market Scanner
- [ ] Open `THub V2 - Adaptive Market Scanner`
- [ ] Click "Execute Workflow" manually
- [ ] Verify:
  - [ ] Market status check passes
  - [ ] Adaptive filters apply correctly
  - [ ] Market scan executes
  - [ ] Quality control runs
  - [ ] Results are queued

### 2. Test Batch Analysis
- [ ] Use test script: `./n8n/test-workflows.sh batch`
- [ ] Or trigger manually via webhook node
- [ ] Verify:
  - [ ] Symbols are processed in batches
  - [ ] Analysis completes
  - [ ] Results aggregate correctly

### 3. Test Signal Monitor
- [ ] Open `THub V2 - Signal Monitor Real-time`
- [ ] Execute manually
- [ ] Verify:
  - [ ] Active signals retrieved
  - [ ] Status processed correctly
  - [ ] Alerts formatted (if any)

## Step 5: Production Configuration

### Enable Schedules
- [ ] Market Scanner: Enable schedule trigger
- [ ] Signal Monitor: Enable schedule trigger
- [ ] Pre-Market Scanner: Enable schedule trigger (if using)
- [ ] Performance Tracker: Enable schedule trigger (if using)

### Configure Error Handling
- [ ] Create error handler workflow
- [ ] Set as error workflow in each main workflow
- [ ] Configure error notifications

### Set Execution Settings
- [ ] Execution timeout: 300 seconds
- [ ] Save manual executions: Yes
- [ ] Execution order: v1

## Step 6: Monitoring Setup

### Execution History
- [ ] Review successful executions
- [ ] Check execution times
- [ ] Monitor resource usage

### Performance Metrics
- [ ] Candidates found per scan: 20-30 ✓
- [ ] Scan execution time: < 4 minutes ✓
- [ ] Error rate: < 5% ✓
- [ ] API usage: < 80% of limit ✓

## Step 7: Gradual Rollout

### Day 1 - Limited Testing
- [ ] Set market scan limit to 5
- [ ] Run manually every hour
- [ ] Monitor all results
- [ ] Document any issues

### Day 2 - Expanded Testing
- [ ] Increase limit to 100
- [ ] Enable hourly schedule
- [ ] Test batch analysis
- [ ] Verify signal creation

### Day 3 - Full Deployment
- [ ] Remove symbol limit
- [ ] Enable 30-minute schedule
- [ ] Monitor API usage closely
- [ ] Check signal quality

### Week 2 - Advanced Features
- [ ] Enable adaptive filtering
- [ ] Activate pre-market scanner
- [ ] Add performance tracking
- [ ] Implement alerts

## Troubleshooting Checklist

If workflows fail:
- [ ] Check n8n logs for errors
- [ ] Verify webhook endpoint accessible
- [ ] Test authentication with curl
- [ ] Check API rate limits
- [ ] Verify database connectivity
- [ ] Review node timeout settings

## Success Validation

### Workflow Health
- [ ] All workflows executing on schedule
- [ ] No failed executions in 24 hours
- [ ] Average execution time stable

### Business Metrics
- [ ] Signals being generated regularly
- [ ] Signal quality score > 70 average
- [ ] Discovering overlooked opportunities
- [ ] Users engaging with signals

## Notes Section

Record any custom configurations or issues:

```
Date: ___________
Notes:
_________________________________
_________________________________
_________________________________
```

## Quick Commands

Test webhook endpoint:
```bash
curl http://localhost:3000/api/webhooks/n8n
```

Test market scan:
```bash
./n8n/test-workflows.sh scan-small
```

View logs:
```bash
docker logs n8n  # If using Docker
# or check n8n UI execution history
```

---

✅ **Setup Complete!** Your automated market scanning system is now operational.