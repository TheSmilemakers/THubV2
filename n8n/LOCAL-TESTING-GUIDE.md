# Local Testing Guide for THub V2 n8n Workflows

This guide specifically covers testing n8n workflows with your local THub V2 backend before any deployment.

## Why Test Locally First?

- **No Frontend Required**: Backend API is all you need
- **Faster Iteration**: Changes take effect immediately
- **Better Debugging**: Direct access to console logs
- **Cost-Free**: No Vercel or hosting charges during development
- **Full Control**: Modify and test instantly

## Prerequisites

- [ ] THub V2 backend code (already complete ✓)
- [ ] Local Node.js environment (already setup ✓)
- [ ] Access to n8n.anikamaher.com
- [ ] Supabase database (already connected ✓)
- [ ] (Optional) ngrok for external access

## Step-by-Step Local Testing Setup

### Step 1: Prepare Your Local Backend

1. **Open terminal and navigate to project:**
   ```bash
   cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
   ```

2. **Ensure dependencies are installed:**
   ```bash
   npx pnpm install
   ```

3. **Start the backend:**
   ```bash
   npx pnpm dev
   ```

4. **Verify it's running:**
   ```bash
   # In a new terminal
   ./test-local-setup.sh
   ```

   You should see:
   ```
   ✓ Backend Running
   ✓ Webhook Healthy
   ✓ Authentication Working
   ✓ Market Scan Functional
   ```

### Step 2: Choose Your Connection Method

#### Option A: Direct Local Connection (Simplest)

Use this if your n8n instance is on the same network or you're running n8n locally:

1. **Find your local IP address:**
   ```bash
   # On Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Use in n8n:**
   - If n8n is on same machine: `http://localhost:3000`
   - If n8n is on same network: `http://192.168.x.x:3000`

#### Option B: ngrok Tunnel (Recommended for Cloud n8n)

Use this for n8n.anikamaher.com or any external n8n instance:

1. **Install ngrok (one-time setup):**
   ```bash
   # Using Homebrew
   brew install ngrok
   
   # Or download directly
   # Visit https://ngrok.com/download
   ```

2. **Start ngrok tunnel:**
   ```bash
   # Make sure your backend is running first!
   ngrok http 3000
   ```

3. **Copy your ngrok URL:**
   ```
   Session Status                online
   Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
   ```
   
   Copy the `https://abc123.ngrok.io` URL

4. **Important ngrok notes:**
   - URL changes each time you restart ngrok
   - Free tier has request limits (sufficient for testing)
   - Keep ngrok running while testing

### Step 3: Configure n8n

1. **Login to n8n.anikamaher.com**

2. **Set Environment Variables:**
   - Go to Settings → Variables
   - Add/Update:
     ```
     APP_URL = https://abc123.ngrok.io  # Your ngrok URL
     N8N_WEBHOOK_SECRET = thub_v2_webhook_secret_2024_secure_key
     ```

3. **Create Webhook Auth Credential:**
   - Go to Credentials → Add Credential
   - Type: Header Auth
   - Name: `THub V2 Local Testing`
   - Header Name: `Authorization`
   - Header Value: `Bearer thub_v2_webhook_secret_2024_secure_key`

### Step 4: Import and Test First Workflow

1. **Start with Market Scanner:**
   - Import `workflows/core/market-scanner-adaptive.json`
   - Disable the schedule initially
   - Update HTTP Request node to use your credential

2. **Run Manual Test:**
   - Click "Execute Workflow"
   - Watch for green nodes (success)
   - Check the output data

3. **Verify in Database:**
   - Open Supabase dashboard
   - Check `market_scan_history` table
   - Verify new entries appear

### Step 5: Test Complete Pipeline

Once the first workflow works:

1. **Import Batch Analysis Workflow**
2. **Test the connection between workflows**
3. **Monitor your local console for logs**

## Testing Commands Reference

### Quick Backend Health Check
```bash
curl http://localhost:3000/api/webhooks/n8n
```

### Test Market Scan (Tiny)
```bash
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_scan","filters":{"limit":1}}'
```

### Test Market Overview
```bash
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_overview"}'
```

### Monitor Backend Logs
Your backend will show logs in the terminal:
```
[n8nWebhook] Webhook request received
[n8nWebhook] Processing webhook action: market_scan
[MarketScan] Scanning US exchange...
[MarketScan] Found 331 candidates from 11,343 symbols
```

## Troubleshooting Local Testing

### Issue: ngrok URL not working
**Solution:**
1. Make sure backend is running FIRST
2. Restart ngrok: `ngrok http 3000`
3. Update n8n with new URL

### Issue: "Connection refused" in n8n
**Solution:**
1. Check backend is running: `npx pnpm dev`
2. Verify URL in n8n variables
3. Test URL directly with curl

### Issue: No data in database
**Solution:**
1. Check Supabase service role key in `.env.local`
2. Verify database migrations are applied
3. Check backend console for errors

### Issue: Timeout errors
**Solution:**
1. Market scan takes ~3-4 seconds
2. Increase timeout in n8n HTTP node to 30000ms
3. Start with smaller limits (5 symbols)

## Local Testing Best Practices

### 1. Start Small
- Test with 1-5 symbol limits
- Verify each step works
- Gradually increase to full market

### 2. Monitor Everything
- Keep backend console visible
- Watch n8n execution in real-time
- Check database after each test

### 3. Use Test Schedule
- Don't enable production schedules yet
- Use manual execution
- Test during market hours for real data

### 4. Save Your ngrok URL
When testing, save your current ngrok URL in a note:
```
Current Session: June 30, 2025
ngrok URL: https://abc123.ngrok.io
Started: 10:00 AM
```

## Moving to Production

Once local testing is complete:

1. **Deploy to Vercel** (when ready)
2. **Update n8n APP_URL** to production URL
3. **Enable workflow schedules**
4. **Monitor for 24 hours**

## Quick Reference Card

```bash
# Terminal 1: Backend
cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
npx pnpm dev

# Terminal 2: ngrok
ngrok http 3000

# Terminal 3: Testing
./test-local-setup.sh
./n8n/test-workflows.sh scan-small

# Monitor logs in Terminal 1
```

## Success Checklist

- [ ] Backend running locally
- [ ] ngrok tunnel established (if needed)
- [ ] n8n variables configured
- [ ] First workflow imported and tested
- [ ] Data appearing in Supabase
- [ ] No errors in execution history

---

Remember: Local testing gives you complete control and visibility. Take advantage of this to perfect your workflows before any deployment!