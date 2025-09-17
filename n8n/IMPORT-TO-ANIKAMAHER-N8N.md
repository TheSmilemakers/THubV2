# Import Fixed Workflows to n8n.anikamaher.com

## Your n8n Instance Configuration

- **URL**: https://n8n.anikamaher.com/
- **API Access**: ✅ Configured  
- **Fixed Workflows**: ✅ Ready for Import

## Step-by-Step Import Process

### Step 1: Access Your n8n Instance

1. Go to: **https://n8n.anikamaher.com/**
2. Log in with your credentials

### Step 2: Import Fixed Workflows

Import these files in order:

#### 2.1: Test Workflow First
1. **Go to**: Workflows → Import from file
2. **Upload**: `webhook-test-simple.json`
3. **Save** the workflow
4. **Activate** the workflow
5. **Test** to ensure basic functionality

#### 2.2: Market Scanner (Main Workflow)
1. **Go to**: Workflows → Import from file
2. **Upload**: `market-scanner-adaptive-fixed.json`
3. **Save** the workflow (don't activate yet)

#### 2.3: Batch Analysis
1. **Go to**: Workflows → Import from file  
2. **Upload**: `batch-analysis-priority-fixed.json`
3. **Save** the workflow (don't activate yet)

### Step 3: Configure Webhook Authentication

This is **CRITICAL** for the workflows to work:

1. **Go to**: Credentials → Add Credential
2. **Select**: HTTP Header Auth
3. **Configure**:
   - **Name**: `n8n Webhook Auth`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer thub_v2_webhook_secret_2024_secure_key`
4. **Save** the credential

### Step 4: Set Environment Variables (In n8n)

For each workflow, you may need to set these variables:

1. **Go to**: Settings → Environment Variables (or Variables)
2. **Add these variables**:
   ```
   APP_URL = http://localhost:3000
   N8N_WEBHOOK_SECRET = thub_v2_webhook_secret_2024_secure_key
   ```

   **Note**: Update `APP_URL` to your THub V2 deployment URL when ready.

### Step 5: Test Each Workflow

#### 5.1: Test Simple Webhook
1. **Open**: `webhook-test-simple` workflow
2. **Copy** the webhook URL from the Test Webhook node
3. **Run this test**:
   ```bash
   curl -X POST [WEBHOOK_URL] \
     -H "Content-Type: application/json" \
     -d '{
       "action": "market_scan",
       "test": true
     }'
   ```

#### 5.2: Test Market Scanner (Manual Execution)
1. **Open**: `market-scanner-adaptive-fixed` workflow
2. **Click**: Execute Workflow (manual test)
3. **Check**: All nodes turn green
4. **Review**: Execution data in each node

#### 5.3: Test API Integration
1. **Ensure THub V2 is running**:
   ```bash
   cd THubV2/trading-hub-v2
   npx pnpm dev
   ```

2. **Test the webhook endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/n8n \
     -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "test",
       "message": "Testing from n8n"
     }'
   ```

### Step 6: Activate Workflows (When Ready)

**Only after successful testing:**

1. **Market Scanner**: Set schedule to run every 30 minutes during market hours
2. **Batch Analysis**: Leave as webhook-triggered (no schedule needed)

## Troubleshooting Guide

### Issue: "Node type version not supported"
**Solution**: The fixed workflows have correct versions. If you see this, you may need to update your n8n instance.

### Issue: "Webhook authentication failed"  
**Solutions**:
1. Check the `n8n Webhook Auth` credential is configured exactly as shown
2. Verify the Bearer token matches: `Bearer thub_v2_webhook_secret_2024_secure_key`
3. Ensure THub V2 API expects this exact token

### Issue: "Cannot read property of undefined"
**Solution**: The fixed workflows have null checks. If you see this, ensure you're using the FIXED versions, not the original ones.

### Issue: "Workflow execution timeout"
**Solutions**:
1. Start with small tests (5 symbols)
2. Check THub V2 API is running and responding
3. Verify `APP_URL` points to the correct THub V2 instance

## Success Verification

✅ **Complete when you can:**
1. Import all 3 workflows without errors
2. Configure webhook authentication successfully  
3. Execute test workflow and get proper response
4. Run market scanner manually and see data flow through all nodes
5. Integrate with THub V2 API and get successful responses

## Next Steps After Import

Once all workflows are imported and tested:

1. **Configure Slack Integration** (if desired)
2. **Set up Google Sheets logging** (if desired)  
3. **Enable scheduled execution** for market scanner
4. **Monitor workflow performance** and execution logs
5. **Scale up** from test limits to full market scanning

**Need Help?** If you encounter any issues during import, I can help troubleshoot specific error messages or configuration problems.