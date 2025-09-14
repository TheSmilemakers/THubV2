# n8n Deployment Guide for THub V2

This guide provides step-by-step instructions for deploying THub V2 trading workflows to your n8n cloud instance.

## Prerequisites

1. ✅ **Environment Variables Configured** (see ENV-CHECKLIST.md)
2. ✅ **TypeScript Compilation Passes** (`npm run type-check`)
3. ✅ **n8n Cloud Instance Access** at https://n8n.anikamaher.com
4. ✅ **THub V2 Application Deployed** with webhook endpoint active

## Workflow Validation Results

Based on deep analysis, the following issues were identified and fixed:

### Issues Found:
- ❌ Missing authentication configuration in all workflows
- ❌ Hardcoded API URLs in market scanner workflow
- ❌ Syntax errors in batch analysis workflow
- ❌ Structural issues in signal monitor workflow
- ❌ Missing environment variables for Google Sheets integration

### Solutions Applied:
- ✅ Created deployment-ready workflow files with proper authentication
- ✅ Replaced hardcoded URLs with environment variables
- ✅ Fixed JSON syntax errors
- ✅ Corrected workflow connection structures
- ✅ Added comprehensive error handling

## Deployment Steps

### Phase 1: Environment Setup

1. **Set n8n Environment Variables**
   ```
   APP_URL = https://your-thub-domain.com
   EODHD_API_KEY = your_actual_eodhd_api_key
   N8N_WEBHOOK_SECRET = your_generated_secret
   ```

2. **Create Authentication Credential**
   - In n8n: Settings > Credentials > Create New
   - Type: "HTTP Header Auth"
   - Name: "THub V2 Webhook Auth"
   - Header Name: "Authorization"
   - Header Value: "Bearer YOUR_N8N_WEBHOOK_SECRET"

### Phase 2: Import Workflows (In Order)

#### Step 1: Test Webhook Connectivity
**File**: `webhook-test-simple-DEPLOY.json`
```bash
# Import this first to test basic connectivity
# Set to active and test with:
curl -X POST https://your-n8n.app.n8n.cloud/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Step 2: Core Market Scanner
**File**: `market-scanner-adaptive-DEPLOY.json`
- **Schedule**: Every 30 minutes (9:30 AM - 4:00 PM EST)
- **Dependencies**: Requires EODHD_API_KEY environment variable
- **Features**: VIX-based adaptive filtering, quality control

#### Step 3: Batch Analysis Engine
**File**: `batch-analysis-priority-DEPLOY.json`
- **Trigger**: Webhook (called by market scanner)
- **Features**: Priority queue processing, parallel execution
- **Authentication**: Uses THub V2 Webhook Auth credential

#### Step 4: Signal Monitoring
**File**: `signal-monitor-realtime-DEPLOY.json`
- **Schedule**: Every 15 minutes
- **Features**: Active signal tracking, stale detection
- **Dependencies**: Google Sheets integration (optional)

#### Step 5: Pre-Market Scanner
**File**: `pre-market-scanner-DEPLOY.json`
- **Schedule**: 8:30 AM EST weekdays
- **Features**: Gap detection, urgent analysis triggers
- **Risk Level**: Low (runs outside market hours)

### Phase 3: Testing & Validation

#### Test 1: Webhook Health Check
```bash
curl -X POST https://your-app.com/api/webhooks/n8n \
  -H "Authorization: Bearer YOUR_N8N_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Expected Response: {"status": "ok", "timestamp": "..."}
```

#### Test 2: Single Symbol Analysis
```bash
curl -X POST https://your-app.com/api/webhooks/n8n \
  -H "Authorization: Bearer YOUR_N8N_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "symbol": "AAPL",
    "priority": "high"
  }'
```

#### Test 3: Batch Analysis (Small Test)
```bash
curl -X POST https://your-app.com/api/webhooks/n8n \
  -H "Authorization: Bearer YOUR_N8N_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "batch_analyze",
    "symbols": ["AAPL", "MSFT", "GOOGL"],
    "priority": "normal"
  }'
```

### Phase 4: Production Deployment Schedule

#### Day 1: Limited Testing
- **Scope**: 5 symbols max per scan
- **Schedule**: Manual execution only
- **Monitor**: API usage, response times, error rates

#### Day 2: Sector Testing  
- **Scope**: 100 symbols (tech sector)
- **Schedule**: Every 2 hours
- **Monitor**: Database growth, signal quality

#### Day 3: Full Market Deployment
- **Scope**: Remove symbol limits
- **Schedule**: Every 30 minutes during market hours
- **Monitor**: Full system performance

#### Week 2: Advanced Features
- **Enable**: Pre-market scanning
- **Enable**: Adaptive VIX filtering
- **Enable**: Priority queue optimization

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Execution Performance**
   - Target: Scan completion < 4 minutes
   - Alert: If > 6 minutes

2. **Signal Quality**
   - Target: 3-5 signals per scan
   - Alert: If 0 signals for 2+ scans

3. **API Usage**
   - Target: < 80% of daily EODHD limit
   - Alert: If > 90% usage

4. **Error Rates**
   - Target: < 5% error rate
   - Alert: If > 10% errors

### n8n Monitoring Setup

1. **Enable Workflow Logs**
   - Settings > Log level: Info
   - Retention: 7 days minimum

2. **Set Up Notifications**
   - Slack/Email integration for failed executions
   - Daily summary reports

3. **Performance Tracking**
   - Use the performance-tracker.json workflow
   - Monitor execution times and success rates

## Troubleshooting Guide

### Common Issues

#### Issue: "Webhook Not Found" (404)
**Cause**: Incorrect webhook URL in n8n workflow
**Solution**: 
1. Check APP_URL environment variable
2. Verify webhook path: `/api/webhooks/n8n`
3. Ensure HTTPS protocol

#### Issue: "Unauthorized" (401)
**Cause**: Authentication failure
**Solution**:
1. Verify N8N_WEBHOOK_SECRET matches in both systems
2. Check HTTP Header Auth credential configuration
3. Ensure "Bearer " prefix in authorization header

#### Issue: "API Limit Exceeded" (429)
**Cause**: EODHD API rate limiting
**Solution**:
1. Reduce scan frequency temporarily
2. Implement symbol batching
3. Check API usage dashboard

#### Issue: "Database Connection Failed"
**Cause**: Supabase configuration issues
**Solution**:
1. Verify Supabase environment variables
2. Check service role key permissions
3. Test database connection manually

### Debug Commands

```bash
# Check n8n workflow status
curl -X GET https://n8n.anikamaher.com/api/v1/workflows \
  -H "X-N8N-API-KEY: YOUR_API_KEY"

# Test THub V2 webhook endpoint
curl -X GET https://your-app.com/api/webhooks/n8n/health

# Check Supabase connection
npx supabase status --local

# Verify environment variables
node -e "console.log({
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  EODHD_KEY: process.env.EODHD_API_KEY ? 'Set' : 'Missing',
  WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET ? 'Set' : 'Missing'
})"
```

## Security Checklist

- [ ] All API keys stored in n8n credentials (not in workflows)
- [ ] Webhook secret is strong (32+ characters)
- [ ] HTTPS enabled for all communications
- [ ] Rate limiting configured on webhook endpoints
- [ ] Error messages don't expose sensitive information
- [ ] API usage monitored to prevent overages
- [ ] Credentials rotated regularly

## Performance Optimization

### n8n Workflow Performance
- Use "Batch" execution for multiple items
- Implement proper error handling to prevent retries
- Use "Wait" nodes for rate limiting
- Minimize HTTP requests per execution

### Database Performance
- Index frequently queried columns
- Use batch inserts for multiple signals
- Implement data retention policies
- Monitor query performance

### API Optimization
- Cache frequently requested data
- Use compression for large responses
- Implement connection pooling
- Monitor and respect rate limits

## Rollback Plan

If issues occur during deployment:

1. **Immediate Actions**
   - Disable problematic workflows in n8n
   - Switch to manual signal generation
   - Monitor error logs

2. **Investigation Steps**
   - Check n8n execution logs
   - Review THub V2 application logs
   - Verify API key validity
   - Test database connectivity

3. **Recovery Options**
   - Revert to previous workflow versions
   - Adjust scan frequency
   - Reduce symbol batch sizes
   - Contact support if needed

## Post-Deployment Checklist

- [ ] All workflows imported and tested
- [ ] Authentication working correctly
- [ ] Signals being generated in database
- [ ] API usage within limits
- [ ] Error rates acceptable
- [ ] Monitoring alerts configured
- [ ] Documentation updated with production URLs
- [ ] Team trained on monitoring procedures

---

**Last Updated**: January 2025
**Next Review**: Post first week of production deployment