# THub V2 n8n Troubleshooting Decision Tree

## Start Here

```mermaid
graph TD
    START[Workflow Issue?] --> TYPE{What type of issue?}
    
    TYPE -->|Not Running| SCHEDULE[Check Schedule]
    TYPE -->|Errors| ERROR[Check Error Type]
    TYPE -->|No Results| RESULTS[Check Results]
    TYPE -->|Performance| PERF[Check Performance]
    
    SCHEDULE --> SCHED1{Schedule Active?}
    SCHED1 -->|No| FIX1[Toggle Schedule ON]
    SCHED1 -->|Yes| SCHED2{Correct Time?}
    SCHED2 -->|No| FIX2[Fix Cron Expression]
    SCHED2 -->|Yes| SCHED3{Timezone Correct?}
    SCHED3 -->|No| FIX3[Set to America/New_York]
    SCHED3 -->|Yes| EXEC[Check Execution History]
```

## Issue Type: Authentication Errors

### Symptom: "401 Unauthorized" in HTTP Request nodes

**Decision Tree:**
```
1. Is the error in "Execute Market Scan" node?
   ├─ YES → Check webhook auth credential
   │   ├─ Open node settings
   │   ├─ Verify credential selected
   │   └─ Check credential value:
   │       └─ Must be: "Bearer thub_v2_webhook_secret_2024_secure_key"
   │
   └─ NO → Is it in external service node?
       ├─ Slack → Re-authenticate OAuth2
       └─ Google Sheets → Refresh OAuth2 token
```

**Quick Fix:**
```bash
# Test webhook auth from terminal
curl -I https://your-app.vercel.app/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key"

# Should return: HTTP/2 200
```

## Issue Type: No Market Scan Results

### Symptom: Market scanner runs but finds 0 candidates

**Diagnostic Flow:**
```
1. Check Market Hours
   ├─ Current time between 9:30 AM - 4:00 PM EST?
   │   ├─ NO → Normal, market closed
   │   └─ YES → Continue diagnosis
   │
2. Check Webhook Response
   ├─ Look at "Execute Market Scan" node output
   ├─ totalScanned > 0?
   │   ├─ NO → API connection issue
   │   └─ YES → Filters too restrictive
   │
3. Test with Relaxed Filters
   └─ Modify Code node:
       - minVolume: 100000 (was 1000000)
       - minDailyChange: 0.5 (was 2)
       - Run manually
```

**Solutions by Cause:**

| Cause | Solution |
|-------|----------|
| Market Closed | Wait for market hours or test with yesterday's data |
| API Down | Check EODHD status page |
| Filters Too Strict | Gradually relax filters until candidates found |
| Wrong Exchange | Ensure exchange = "US" in filters |

## Issue Type: Timeout Errors

### Symptom: Node times out before completing

**Resolution Steps:**
```
1. Identify which node times out
   └─ "Execute Market Scan" → Increase timeout
       ├─ Open node settings
       ├─ Options → Timeout
       ├─ Change: 30000 → 60000 (60 seconds)
       └─ Save

2. If still timing out
   └─ Reduce operation size
       ├─ Market Scan: Reduce limit (30 → 15)
       ├─ Batch Analysis: Reduce batch size (10 → 5)
       └─ Test again

3. Check API performance
   └─ Run simple test:
       curl -w "@curl-format.txt" -X POST ...
       └─ If > 30s response time → API issue
```

## Issue Type: Workflow Execution Failures

### Complete Diagnostic Checklist

```markdown
## Pre-Flight Checks
- [ ] n8n instance accessible (https://n8n.anikamaher.com)
- [ ] THub V2 app running (test webhook endpoint)
- [ ] Database accessible (check Supabase)
- [ ] API key valid (test EODHD call)

## Workflow Checks
- [ ] All nodes have green checkmarks (no config errors)
- [ ] Credentials assigned to all HTTP nodes
- [ ] Schedule nodes show "Active"
- [ ] No syntax errors in Code nodes

## Execution Analysis
1. Go to Executions → Filter by workflow
2. Find failed execution
3. Click to open
4. Look for red nodes
5. Click red node → Check error message

## Common Error Patterns
| Error Message | Likely Cause | Fix |
|--------------|--------------|-----|
| "ECONNREFUSED" | Service down | Check if API is running |
| "ETIMEDOUT" | Network issue | Increase timeout |
| "Invalid JSON" | API response issue | Check API health |
| "Rate limit" | Too many requests | Add delays |
| "No data" | Empty response | Check filters |
```

## Issue Type: Signal Quality Problems

### Symptom: Signals generated but poor quality

**Quality Improvement Decision Tree:**
```
Signal Score < 70?
├─ YES → Adjust scoring weights
│   └─ In adaptive-filters.js:
│       - Increase momentum weight if trending market
│       - Increase liquidity weight if volatile
│
└─ NO → Too many false positives?
    ├─ YES → Tighten quality controls
    │   └─ Add to Quality Control node:
    │       - Stricter volume requirements
    │       - News verification check
    │
    └─ NO → Check historical performance
        └─ Use Performance Tracker data
```

## Advanced Debugging Techniques

### 1. Enable Verbose Logging

Add Console node after problematic node:
```javascript
console.log('=== DEBUG INFO ===');
console.log('Input data:', JSON.stringify($input.all(), null, 2));
console.log('Node output:', JSON.stringify($json, null, 2));
console.log('Execution ID:', $execution.id);
console.log('Workflow ID:', $workflow.id);
console.log('Timestamp:', new Date().toISOString());
return $input.all();
```

### 2. Test Data Flow

Create test workflow with only:
1. Manual trigger
2. Problematic node
3. Console output

This isolates the issue.

### 3. API Testing Outside n8n

```bash
# Create test script
cat > test-api.sh << 'EOF'
#!/bin/bash
echo "Testing THub V2 API..."

# Test 1: Health check
echo -n "Health Check: "
curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app/api/webhooks/n8n

# Test 2: Market scan
echo -e "\n\nMarket Scan Test:"
curl -X POST https://your-app.vercel.app/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_scan","filters":{"limit":1}}' | jq '.'
EOF

chmod +x test-api.sh
./test-api.sh
```

## Recovery Procedures

### Complete Workflow Reset

If nothing else works:

1. **Export Current Workflow**
   - Open workflow
   - Menu → Download

2. **Delete and Recreate**
   - Delete workflow
   - Import fresh from JSON
   - Reconfigure credentials
   - Test manually

3. **Gradual Activation**
   - Run manually first
   - Enable schedule for 1 hour
   - Monitor closely
   - Extend schedule if stable

### Database Recovery

If signals aren't being stored:

```sql
-- Check recent scans
SELECT * FROM market_scan_history 
ORDER BY created_at DESC 
LIMIT 10;

-- Check queue status
SELECT COUNT(*) as pending 
FROM market_scan_queue 
WHERE processed = false;

-- Clear stuck queue items
UPDATE market_scan_queue 
SET processed = true 
WHERE created_at < NOW() - INTERVAL '1 day';
```

## Performance Optimization

### If Workflows Are Slow

1. **Check Execution Times**
   - Executions → Sort by duration
   - Identify slowest nodes
   - Focus optimization there

2. **Common Optimizations**
   ```javascript
   // Cache frequently used data
   const cacheKey = 'market_conditions';
   let marketData = $getWorkflowStaticData(cacheKey);
   
   if (!marketData || marketData.timestamp < Date.now() - 300000) {
     // Fetch fresh data
     marketData = await fetchMarketConditions();
     $setWorkflowStaticData(cacheKey, marketData);
   }
   ```

3. **Reduce API Calls**
   - Batch operations where possible
   - Use bulk endpoints
   - Implement smart caching

## Monitoring Best Practices

### Daily Health Check (5 minutes)

```
1. Open https://n8n.anikamaher.com/executions
2. Check last 24 hours:
   - Any failed executions? → Investigate
   - Average execution time increasing? → Optimize
   - All workflows running on schedule? → Verify

3. Quick Slack check:
   - Signals being posted?
   - Performance reports arriving?
   - Any error notifications?
```

### Weekly Deep Dive (30 minutes)

```
1. Review Performance Tracker reports
2. Analyze signal quality trends
3. Check API usage statistics
4. Update filters if needed
5. Clear old execution data
6. Test each workflow manually
```

## Emergency Procedures

### All Workflows Failing

1. **Stop all schedules immediately**
2. **Check service status:**
   - n8n instance health
   - THub V2 API status
   - EODHD API status
   - Database connectivity

3. **Test minimal setup:**
   - Create simple test workflow
   - Manual trigger → Set node → Output
   - If this fails → n8n instance issue

4. **Gradual restoration:**
   - Fix identified issues
   - Test one workflow manually
   - Enable one schedule
   - Monitor for 1 hour
   - Gradually enable others

### Data Corruption

If seeing impossible values (e.g., 1000% gains):

1. **Add data validation:**
   ```javascript
   // In Quality Control node
   const maxReasonableChange = 50; // 50%
   const validCandidates = candidates.filter(c => {
     if (Math.abs(c.changePercent) > maxReasonableChange) {
       console.error(`Data corruption detected: ${c.symbol} shows ${c.changePercent}% change`);
       return false;
     }
     return true;
   });
   ```

2. **Log suspicious data for analysis**
3. **Notify administrators immediately**

---

Remember: When in doubt, start with the simplest test case and gradually add complexity until you identify where the issue occurs.