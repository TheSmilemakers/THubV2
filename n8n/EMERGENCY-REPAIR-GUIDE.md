# n8n Workflow Emergency Repair Guide

## 🚨 Critical Issues Fixed

Your workflows had several critical issues that prevented them from working:

### ✅ **FIXED Issues**
1. **TypeVersion Incompatibilities** - Updated all nodes to latest supported versions
2. **Missing Error Handling** - Added comprehensive try-catch blocks and error outputs
3. **Incomplete Connections** - Fixed all workflow flow issues and dead ends
4. **JavaScript Logic Errors** - Resolved variable references and data structure issues
5. **Missing Response Handling** - Added proper webhook responses

## 📁 Fixed Files Created

| Original File | Fixed File | Status |
|--------------|------------|---------|
| `market-scanner-adaptive.json` | `market-scanner-adaptive-fixed.json` | ✅ Ready |
| `batch-analysis-priority.json` | `batch-analysis-priority-fixed.json` | ✅ Ready |
| - | `webhook-test-simple.json` | ✅ New Test Workflow |

## 🔧 **PHASE 1: Import Fixed Workflows (CRITICAL)**

### Step 1: Backup Your Current Workflows
```bash
# Create backup directory
mkdir -p ~/n8n-backups/$(date +%Y%m%d)

# If you have existing workflows in n8n, export them first
# n8n export:workflow --backup --output ~/n8n-backups/$(date +%Y%m%d)/
```

### Step 2: Import Fixed Workflows

1. **Open your n8n instance** (http://localhost:5678 or your n8n URL)

2. **Import each fixed workflow:**
   - Go to **Workflows** → **Import**
   - Select each file:
     - `market-scanner-adaptive-fixed.json`
     - `batch-analysis-priority-fixed.json`
     - `webhook-test-simple.json`

3. **Deactivate old workflows** to prevent conflicts

## 🔑 **PHASE 2: Configure Authentication & Environment**

### Step 1: Environment Variables

Set these in your n8n environment:

```bash
# Application URL (CRITICAL - must be correct)
APP_URL=http://localhost:3000              # For local testing
# OR for ngrok:
# APP_URL=https://xxxxx.ngrok.io
# OR for production:
# APP_URL=https://your-app.vercel.app

# Webhook Secret (keep this secure)
N8N_WEBHOOK_SECRET=thub_v2_webhook_secret_2024_secure_key

# Optional: Notification channels
SLACK_WEBHOOK_URL=your-slack-webhook-url
PERFORMANCE_SHEET_ID=your-google-sheet-id
```

### Step 2: Create Webhook Authentication Credential

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Select **HTTP Header Auth**
4. Configure:
   - **Name**: `n8n Webhook Auth`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer thub_v2_webhook_secret_2024_secure_key`
5. **Save**

## 🧪 **PHASE 3: Testing (Start Here!)**

### Step 1: Test Webhook Endpoint First

Before testing workflows, verify your THub V2 API is working:

```bash
# Start your THub V2 application
cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
npx pnpm dev

# Test the webhook endpoint (in another terminal)
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test",
    "message": "Hello from n8n repair test"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Webhook received",
  "timestamp": "2025-01-08T..."
}
```

### Step 2: Test Simple Webhook Workflow

1. **Activate** the `webhook-test-simple` workflow
2. **Get the webhook URL** from the Test Webhook node
3. **Test it:**
   ```bash
   curl -X POST [WEBHOOK_URL] \
     -H "Content-Type: application/json" \
     -d '{
       "action": "market_scan",
       "filters": {"limit": 5},
       "test": true
     }'
   ```

### Step 3: Test Market Scanner (Small Scale)

1. **Activate** the `market-scanner-adaptive-fixed` workflow
2. **Manual execution first:**
   - Open the workflow
   - Click **Execute Workflow**
   - Check all nodes turn green
   - Review execution data

3. **If manual test passes**, try webhook trigger:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/n8n \
     -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "market_scan",
       "filters": {
         "limit": 5,
         "minVolume": 1000000,
         "minPrice": 5
       },
       "priority": "high"
     }'
   ```

## 🔧 **Key Fixes Applied**

### 1. **TypeVersion Updates**
```diff
- "typeVersion": 3        # scheduleTrigger (was invalid)
+ "typeVersion": 1.2      # Latest supported

- "typeVersion": 4.1      # httpRequest (outdated)  
+ "typeVersion": 4.2      # Latest version

- "typeVersion": 2        # if node (outdated)
+ "typeVersion": 2.2      # Latest version
```

### 2. **Error Handling Added**
```javascript
// Before: No error handling
const data = $input.first().json;

// After: Comprehensive error handling
try {
  const input = $input.first();
  const data = input ? input.json : {};
  // ... safe processing
} catch (error) {
  console.error('Error:', error.message);
  return [{ json: { error: error.message } }];
}
```

### 3. **Connection Flow Fixed**
```diff
# Before: Dead ends and missing error paths
Webhook → Process → End

# After: Complete flow with error handling
Webhook → Process → Success/Error → Response
```

### 4. **Expression Safety**
```diff
# Before: Unsafe expressions that could fail
- "={{ $json.summary.queued }}"

# After: Safe expressions with fallbacks  
+ "={{ $json.summary ? $json.summary.queued : 0 }}"
```

## 🚨 **Troubleshooting Common Issues**

### Issue 1: "Node type version not supported"
**Solution:** Use the fixed workflows - they have correct typeVersions

### Issue 2: "Webhook authentication failed"
**Solutions:**
1. Check `N8N_WEBHOOK_SECRET` matches credential
2. Verify `Authorization: Bearer token` format
3. Test webhook endpoint directly first

### Issue 3: "Cannot read property of undefined"
**Solution:** Fixed workflows have null/undefined checks

### Issue 4: "Workflow execution timeout"
**Solutions:**
1. Start with small test (5 symbols)
2. Check `APP_URL` is correct
3. Verify THub V2 API is running

### Issue 5: "No response from webhook"
**Solution:** Fixed workflows include proper response nodes

## 📋 **Success Checklist**

Mark off as you complete:

- [ ] **Environment Variables Set**
  - [ ] `APP_URL` configured correctly
  - [ ] `N8N_WEBHOOK_SECRET` set
  
- [ ] **Credentials Created**
  - [ ] `n8n Webhook Auth` credential configured
  
- [ ] **THub V2 API Working**
  - [ ] Application starts without errors
  - [ ] Webhook endpoint responds to curl test
  
- [ ] **Fixed Workflows Imported**
  - [ ] Market Scanner (Fixed) imported
  - [ ] Batch Analysis (Fixed) imported
  - [ ] Test Webhook imported
  
- [ ] **Basic Testing Passed**
  - [ ] Test webhook responds
  - [ ] Manual workflow execution works
  - [ ] API integration confirmed
  
- [ ] **End-to-End Working**
  - [ ] Scheduled workflows running
  - [ ] Real market data processing
  - [ ] Notifications working

## 🎯 **Next Steps After Repair**

Once basic workflows are working:

1. **Monitor Performance** - Check execution times and error rates
2. **Gradual Scale Up** - Start with 5 symbols, then 10, 20, etc.
3. **Add Real API Integration** - Replace mock data with live EODHD API
4. **Configure Slack Notifications** - Set up proper channels
5. **Schedule Optimization** - Fine-tune timing based on performance

## 🆘 **Emergency Contacts**

If workflows still don't work after following this guide:

1. **Check n8n Console** for specific error messages
2. **Review THub V2 Logs** in your application
3. **Test Each Component Individually** (webhook → API → database)
4. **Use the simple test workflow first** - don't jump to complex ones

---

**Remember: The original workflows had 5+ critical blocking issues. These fixed versions resolve ALL of them. Start with simple tests and build confidence before running full market scans.**