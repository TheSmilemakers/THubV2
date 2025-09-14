# Vercel Deployment Guide for THub V2

Deploy THub V2 to https://thub.rajanmaher.com with seamless n8n integration.

## Prerequisites

- ✅ Vercel account with domain access
- ✅ GitHub repository with latest THub V2 code
- ✅ Environment variables ready (see ENV-CHECKLIST.md)
- ✅ Supabase project configured
- ✅ EODHD API key obtained

## Step 1: Domain Configuration

### 1.1 Add Custom Domain in Vercel
1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add custom domain: `thub.rajanmaher.com`
3. Configure DNS records as instructed by Vercel

### 1.2 DNS Records (via your domain provider)
```
Type: CNAME
Name: thub
Value: cname.vercel-dns.com
```

## Step 2: Environment Variables Setup

### 2.1 Production Environment Variables
In Vercel Dashboard > Project > Settings > Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Market Data API
EODHD_API_KEY=your-eodhd-api-key

# Application URL
NEXT_PUBLIC_APP_URL=https://thub.rajanmaher.com

# n8n Webhook Security (generate strong secret)
N8N_WEBHOOK_SECRET=your-32-char-secret-here
```

### 2.2 Generate Secure Webhook Secret
```bash
# Generate a strong 32-character secret
openssl rand -base64 32

# Example output: xK9mP2vL8nQ4wR7tY5uZ3aB6cE1fH9jI
```

## Step 3: Deploy to Vercel

### 3.1 Connect Repository
1. Go to Vercel Dashboard > Add New Project
2. Import from GitHub: `your-username/thub-v2`
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (if in root) or `THubV2/trading-hub-v2`
   - **Build Command**: `npm run build` (or `pnpm build`)
   - **Output Directory**: `.next`

### 3.2 Deploy Configuration
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev"
}
```

### 3.3 Verify Deployment
1. Check build logs for errors
2. Test https://thub.rajanmaher.com loads correctly
3. Verify API routes: `https://thub.rajanmaher.com/api/webhooks/n8n/health`

## Step 4: Configure n8n Integration

### 4.1 Set n8n Environment Variables
In n8n.anikamaher.com > Settings > Environment Variables:
```
APP_URL=https://thub.rajanmaher.com
N8N_WEBHOOK_SECRET=your-32-char-secret-here
EODHD_API_KEY=your-eodhd-api-key
```

### 4.2 Create Authentication Credential
1. In n8n: Settings > Credentials > Create New
2. **Type**: HTTP Header Auth
3. **Name**: "THub V2 Production Auth"
4. **Header Name**: "Authorization"
5. **Header Value**: "Bearer your-32-char-secret-here"

## Step 5: Deploy n8n Workflows

### 5.1 Import Workflows via MCP
Use the deployment-ready workflow files in order:

1. **Test Workflow First**:
   ```
   File: webhook-test-simple-DEPLOY.json
   Purpose: Verify connectivity between n8n and THub V2
   ```

2. **Core Workflows**:
   ```
   - market-scanner-adaptive-DEPLOY.json
   - batch-analysis-priority-DEPLOY.json
   - signal-monitor-realtime-DEPLOY.json
   ```

3. **Advanced Features**:
   ```
   - pre-market-scanner-DEPLOY.json
   ```

### 5.2 Workflow Import Commands
```bash
# Use n8n MCP to import workflows
# This will be done via the n8n MCP integration in the next step
```

## Step 6: Test Integration

### 6.1 API Health Check
```bash
curl https://thub.rajanmaher.com/api/webhooks/n8n/health
# Expected: {"status": "ok", "timestamp": "..."}
```

### 6.2 Test n8n Webhook
```bash
curl -X POST https://thub.rajanmaher.com/api/webhooks/n8n \
  -H "Authorization: Bearer your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "source": "deployment-test"}'
```

### 6.3 Test Market Scan
```bash
curl -X POST https://thub.rajanmaher.com/api/webhooks/n8n \
  -H "Authorization: Bearer your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "market_scan",
    "filters": {
      "maxSymbols": 5,
      "sectors": ["Technology"]
    },
    "priority": "normal"
  }'
```

## Step 7: Monitor Performance

### 7.1 Key Metrics to Track
- **Response Time**: < 2s initial load
- **API Latency**: < 500ms for webhook calls
- **Error Rate**: < 5% for all requests
- **Signal Generation**: 3-5 signals per scan

### 7.2 Monitoring Tools
- Vercel Analytics (built-in)
- Supabase metrics dashboard
- n8n execution logs
- Custom performance tracking in app

## Step 8: Production Checklist

- [ ] Domain `thub.rajanmaher.com` resolves correctly
- [ ] SSL certificate active (auto-managed by Vercel)
- [ ] All environment variables set in Vercel
- [ ] Supabase RLS policies enabled
- [ ] EODHD API key validated
- [ ] n8n webhook secret configured identically in both systems
- [ ] Test workflow successfully deployed and tested
- [ ] Core workflows imported and validated
- [ ] End-to-end market scan test completed successfully
- [ ] Error handling tested (invalid requests, API failures)
- [ ] Performance targets met (< 2s load time)

## Troubleshooting

### Common Issues

**Issue**: Domain not resolving
**Solution**: Check DNS propagation (can take up to 24 hours)

**Issue**: "Function timeout" errors
**Solution**: Optimize API calls, implement caching

**Issue**: "Environment variable not found"
**Solution**: Verify all variables set in Vercel dashboard

**Issue**: n8n webhook authentication fails
**Solution**: Ensure N8N_WEBHOOK_SECRET matches exactly in both systems

### Debug Commands
```bash
# Check DNS resolution
nslookup thub.rajanmaher.com

# Test SSL certificate
curl -I https://thub.rajanmaher.com

# Check API endpoint
curl https://thub.rajanmaher.com/api/health

# Verify environment variables (in development)
npm run dev -- --verbose
```

## Next Steps

1. **Deploy Test Workflow**: Import and test webhook connectivity
2. **Import Core Workflows**: Deploy main trading workflows
3. **Enable Monitoring**: Set up alerts and dashboards
4. **Scale Gradually**: Start with limited scanning, increase over time
5. **User Testing**: Invite beta users to test the platform

---

**Domain**: https://thub.rajanmaher.com  
**n8n Instance**: https://n8n.anikamaher.com  
**Deployment**: Vercel with auto-scaling  
**Database**: Supabase with edge regions