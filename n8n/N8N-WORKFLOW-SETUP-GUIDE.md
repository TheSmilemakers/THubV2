# Complete n8n Workflow Setup Guide for THub V2
*For n8n.anikamaher.com Self-Hosted Instance*

This guide provides detailed step-by-step instructions for setting up the THub V2 automated market scanning workflows on your n8n instance.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Testing Setup](#local-testing-setup)
3. [Environment Setup](#environment-setup)
4. [Credentials Configuration](#credentials-configuration)
5. [Workflow Import Process](#workflow-import-process)
6. [Individual Workflow Setup](#individual-workflow-setup)
7. [Testing Each Workflow](#testing-each-workflow)
8. [Production Activation](#production-activation)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- [ ] Access to n8n.anikamaher.com with admin privileges
- [ ] THub V2 backend running locally OR deployed
- [ ] The webhook secret: `thub_v2_webhook_secret_2024_secure_key`
- [ ] (Optional) ngrok installed for external access to local backend
- [ ] (Optional) Slack workspace for notifications
- [ ] (Optional) Google Sheets for performance tracking

---

## Local Testing Setup

### Option A: Direct Local Connection

If your n8n instance can reach your local network:

1. **Start your backend locally:**
   ```bash
   cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
   npx pnpm dev
   ```

2. **Verify backend is running:**
   ```bash
   ./test-local-setup.sh
   ```

3. **Use local URL in n8n:**
   - APP_URL = `http://localhost:3000`
   - Or use your machine's IP: `http://192.168.x.x:3000`

### Option B: ngrok Tunnel (Recommended)

For n8n cloud instances that can't reach your local network:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # Or download from https://ngrok.com
   ```

2. **Start your backend:**
   ```bash
   npx pnpm dev
   ```

3. **Create ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Use ngrok URL in n8n:**
   - APP_URL = `https://5bba-194-34-235-99.ngrok-free.app`

### Option C: Deployed Backend

If you've already deployed to Vercel:
- APP_URL = `https://your-app.vercel.app`

---

## Environment Setup

### Step 1: Access n8n Settings

1. Navigate to https://n8n.anikamaher.com
2. Log in with your credentials
3. Click on **Settings** in the left sidebar
4. Select **Variables** from the settings menu

### Step 2: Add Environment Variables

Click **"Add Variable"** for each of the following:

#### Required Variables:

**Variable 1: APP_URL**
- Key: `APP_URL`
- Value: Choose based on your setup:
  - Local testing: `http://localhost:3000`
  - ngrok tunnel: `https://your-ngrok-id.ngrok.io`
  - Production: `https://your-thub-v2-app.vercel.app`
- Click **Save**

**Variable 2: N8N_WEBHOOK_SECRET**
- Key: `N8N_WEBHOOK_SECRET`
- Value: `thub_v2_webhook_secret_2024_secure_key`
- Click **Save**

#### Optional Variables (add if using):

**Variable 3: SLACK_WEBHOOK_URL**
- Key: `SLACK_WEBHOOK_URL`
- Value: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
- Click **Save**

**Variable 4: PERFORMANCE_SHEET_ID**
- Key: `PERFORMANCE_SHEET_ID`
- Value: `your-google-sheet-id`
- Click **Save**

### Step 3: Verify Variables

After adding all variables:
1. Refresh the page
2. Go back to Settings → Variables
3. Confirm all variables are listed and saved

---

## Credentials Configuration

### Step 1: Create HTTP Header Auth Credential

This credential is used for authenticating with your THub V2 webhook endpoint.

1. Click **Credentials** in the left sidebar
2. Click **"Add Credential"** button
3. Search for **"Header Auth"** in the credential types
4. Click on **Header Auth**

Configure as follows:
- **Credential Name**: `THub V2 Webhook Auth`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer thub_v2_webhook_secret_2024_secure_key`

5. Click **"Create"** to save

### Step 2: Create Slack Credential (Optional)

If using Slack notifications:

1. Click **"Add Credential"**
2. Search for **"Slack"**
3. Choose **"Slack OAuth2 API"**
4. Follow the OAuth2 flow to connect your Slack workspace
5. Name it: `THub V2 Slack`
6. Save the credential

### Step 3: Create Google Sheets Credential (Optional)

If using performance tracking:

1. Click **"Add Credential"**
2. Search for **"Google Sheets"**
3. Choose **"Google Sheets OAuth2 API"**
4. Follow the OAuth2 flow
5. Name it: `THub V2 Performance Tracking`
6. Save the credential

---

## Workflow Import Process

### Method 1: Direct JSON Import (Recommended)

For each workflow file:

1. Open the workflow JSON file on your computer
2. Copy the entire JSON content
3. In n8n, click **Workflows** in the sidebar
4. Click **"Add Workflow"** → **"Import from JSON"**
5. Paste the JSON content
6. Click **"Import"**
7. The workflow will open automatically

### Method 2: File Upload

1. Click **Workflows** in the sidebar
2. Click **"Add Workflow"** → **"Import from File"**
3. Select the workflow JSON file
4. Click **"Import"**

---

## Individual Workflow Setup

### 1. Market Scanner Adaptive Workflow

**File**: `workflows/core/market-scanner-adaptive.json`

#### After Import:
1. **Rename** (optional): Click workflow name → "THub V2 - Market Scanner"
2. **Check Schedule Node**:
   - Double-click "Market Hours Schedule" node
   - Verify: Runs every 30 minutes
   - Timezone should be "America/New_York"
3. **Fix Credential Errors**:
   - Look for red error badges on nodes
   - Double-click "Execute Market Scan" node
   - In Authentication dropdown, select "THub V2 Webhook Auth"
   - Click "Save"
4. **Configure Notifications** (if using Slack):
   - Double-click "Notify Signals" node
   - Select your Slack credential
   - Update channel name if needed
5. **Save Workflow**: Click "Save" button (top right)

#### Test the Workflow:
1. Click **"Execute Workflow"** button
2. Watch nodes execute (they'll turn green)
3. Check for any red error nodes
4. Review output data by clicking completed nodes

### 2. Batch Analysis Priority Workflow

**File**: `workflows/core/batch-analysis-priority.json`

#### After Import:
1. **Configure Webhook Trigger**:
   - Double-click "Batch Analysis Trigger" node
   - Copy the webhook URL shown
   - Save this URL for later use
2. **Fix Credentials**:
   - Double-click "Analyze Batch" node
   - Select "THub V2 Webhook Auth"
   - Save
3. **Configure Notifications**:
   - Update Slack node with credential and channel
4. **Save Workflow**

#### Note the Webhook URL:
This workflow is triggered by other workflows. Note down:
- Production URL: `https://n8n.anikamaher.com/webhook/WEBHOOK_ID`
- Test URL: `https://n8n.anikamaher.com/webhook-test/WEBHOOK_ID`

### 3. Pre-Market Gap Scanner

**File**: `workflows/advanced/pre-market-scanner.json`

#### After Import:
1. **Check Schedule**:
   - Double-click "Pre-Market Schedule" node
   - Verify: "30 8 * * 1-5" (8:30 AM weekdays)
   - Timezone: "America/New_York"
2. **Fix Credentials**:
   - Update "Execute Pre-Market Scan" node
   - Update "Analyze Priority Gaps" node
3. **Configure Alerts**:
   - Update Slack channel to "#pre-market-alerts" or preferred
4. **Save Workflow**

### 4. Signal Monitor Real-time

**File**: `workflows/core/signal-monitor-realtime.json`

#### After Import:
1. **Check Schedule**:
   - Verify: Runs every 15 minutes
2. **Fix Credentials**:
   - Update "Get Active Signals" node
3. **Configure Monitoring Channel**:
   - Update Slack to "#signal-monitoring" or preferred
4. **Save Workflow**

### 5. Performance Tracker

**File**: `workflows/monitoring/performance-tracker.json`

#### After Import:
1. **Check Schedule**:
   - Verify: "30 16 * * 1-5" (4:30 PM weekdays)
2. **Fix Credentials**:
   - Update HTTP request node
3. **Configure Reporting**:
   - Update Slack to "#performance-reports"
   - If using Google Sheets, select credential
4. **Save Workflow**

---

## Testing Each Workflow

### Test 1: Market Scanner (Manual)

1. Open "THub V2 - Market Scanner" workflow
2. **Disable Schedule** temporarily:
   - Double-click schedule node
   - Toggle "Active" to OFF
   - Save
3. Click **"Execute Workflow"**
4. Monitor execution:
   - ✅ Green nodes = success
   - ❌ Red nodes = check error
5. Click on "Execute Market Scan" node after completion
6. View the JSON output to verify scan results

### Test 2: Webhook Endpoint

From your terminal (adjust URL based on your setup):

```bash
# For local testing
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "market_scan",
    "filters": {
      "limit": 5
    }
  }'

# For ngrok testing
curl -X POST https://your-ngrok-id.ngrok.io/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "market_scan",
    "filters": {
      "limit": 5
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "action": "market_scan",
  "summary": {
    "totalScanned": 11343,
    "filtered": 331,
    "queued": 5
  }
}
```

### Test 3: Batch Analysis Trigger

Using the webhook URL from the Batch Analysis workflow:

```bash
curl -X POST https://n8n.anikamaher.com/webhook/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "GOOGL", "MSFT"],
    "priority": "high",
    "metadata": {
      "source": "manual_test"
    }
  }'
```

### Test 4: Full Pipeline Test

1. Execute Market Scanner manually
2. Verify candidates are found
3. Check if Batch Analysis is triggered
4. Monitor for signal creation notifications

---

## Production Activation

### Phase 1: Limited Schedule (Day 1)

1. **Market Scanner**:
   - Enable schedule
   - Set to run every 2 hours initially
   - Monitor executions

2. **Signal Monitor**:
   - Enable schedule
   - Keep at 15-minute intervals

### Phase 2: Full Schedule (Day 2-3)

1. **Market Scanner**:
   - Change to 30-minute intervals
   - Enable during market hours only

2. **Pre-Market Scanner**:
   - Enable schedule
   - Monitor gap detection

3. **Performance Tracker**:
   - Enable daily reporting

### Phase 3: Optimization (Week 2)

1. Review execution history
2. Adjust timeouts if needed
3. Optimize based on performance data

---

## Monitoring & Troubleshooting

### Execution History

1. Click **Executions** in sidebar
2. Filter by workflow name
3. Review:
   - Success rate
   - Execution time
   - Error patterns

### Common Issues & Solutions

#### Issue: "Unauthorized" Error
**Solution**: 
- Verify webhook secret matches exactly
- Check for extra spaces in credential
- Ensure "Bearer " prefix is included

#### Issue: Timeout Errors
**Solution**:
- Increase timeout in HTTP Request nodes
- Default: 30 seconds → Increase to 60-120 seconds

#### Issue: No Candidates Found
**Solution**:
- Check if market is open
- Verify API endpoint is accessible
- Review filter settings

#### Issue: Credential Not Found
**Solution**:
- Re-select credential in node
- Save workflow after changes
- Refresh browser if needed

### Performance Monitoring

Track these metrics weekly:
- Average execution time
- Success rate percentage
- Candidates per scan
- Signals generated

### Logs Access

1. Click on any execution in history
2. Click on individual nodes
3. View Input/Output data
4. Check error messages in red nodes

---

## Advanced Configuration

### Custom Notification Channels

To add email notifications:
1. Add Email node after Slack nodes
2. Configure SMTP credentials
3. Set recipient addresses

### Rate Limit Management

If hitting API limits:
1. Increase intervals between scans
2. Reduce batch sizes
3. Implement caching in Code nodes

### Workflow Versioning

1. Before major changes, duplicate workflow
2. Name with version: "Market Scanner v2"
3. Test new version before replacing

---

## Maintenance Schedule

### Daily
- Check execution history for failures
- Monitor signal quality

### Weekly
- Review performance metrics
- Adjust filters based on results
- Clear old execution data

### Monthly
- Update workflow logic if needed
- Review API usage and costs
- Optimize based on patterns

---

## Support Resources

### n8n Documentation
- https://docs.n8n.io

### THub V2 Webhook API
- Endpoint: `/api/webhooks/n8n`
- Actions: `market_scan`, `batch_analyze`, `market_overview`

### Debug Mode
Enable verbose logging:
1. Add Console node after problematic nodes
2. Log all data for inspection
3. Remove after debugging

---

## Final Checklist

Before considering setup complete:

- [ ] All workflows imported and saved
- [ ] Credentials configured and working
- [ ] Manual tests successful
- [ ] Schedules enabled appropriately
- [ ] Notifications arriving in Slack
- [ ] Performance tracking operational
- [ ] No errors in last 24 hours

---

🎉 **Congratulations!** Your automated market scanning system is now operational on n8n.anikamaher.com