# n8n Deployment Checklist for THub V2

## 🔑 Generated Credentials
**Webhook Secret**: `7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05`

## ✅ Completed Steps

1. [x] Generated secure webhook secret
2. [x] Created deployment-ready workflow files
3. [x] Updated Market Scanner workflow in n8n to use environment variables
4. [x] Fixed workflow to use `$env.APP_URL` instead of localhost

## 🚧 Required Actions

### 1. Vercel Configuration
- [ ] Add `N8N_WEBHOOK_SECRET` to Vercel environment variables:
  ```
  N8N_WEBHOOK_SECRET=7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05
  ```
- [ ] Redeploy application after adding environment variable

### 2. n8n Configuration

#### Environment Variables (n8n.anikamaher.com → Settings → Variables)
- [ ] `APP_URL`: https://www.thub.rajanmaher.com
- [ ] `N8N_WEBHOOK_SECRET`: 7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05
- [ ] `EODHD_API_KEY`: [Your actual EODHD API key]

#### Credentials to Create (n8n → Credentials → Create New)

1. [ ] **THub V2 Webhook Auth**
   - Type: HTTP Header Auth
   - Header Name: `Authorization`
   - Header Value: `Bearer 7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05`

2. [ ] **EODHD API Auth**
   - Type: HTTP Header Auth
   - Header Name: `Authorization`
   - Header Value: `Bearer [Your EODHD API key]`

### 3. Workflow Updates

1. [ ] **Market Scanner**: Add "THub V2 Webhook Auth" credential to HTTP Request node
2. [ ] **Test Webhook**: Import and activate for testing
3. [ ] **Batch Analysis**: Import from deploy-ready folder
4. [ ] **Signal Monitor**: Import from deploy-ready folder

## 📁 Deployment Files Created

1. `/n8n/PRODUCTION-ENV-CONFIG.md` - Environment configuration reference
2. `/n8n/workflows/deploy-ready/market-scanner-adaptive-DEPLOY.json`
3. `/n8n/workflows/deploy-ready/batch-analysis-priority-DEPLOY.json`
4. `/n8n/workflows/deploy-ready/signal-monitor-realtime-DEPLOY.json`

## 🧪 Testing Commands

### Test Webhook (after Vercel deployment)
```bash
curl -X POST https://www.thub.rajanmaher.com/api/webhooks/n8n \
  -H "Authorization: Bearer 7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05" \
  -H "Content-Type: application/json" \
  -d '{"action": "market_overview"}'
```

### Test n8n Webhook
```bash
curl -X POST https://n8n.anikamaher.com/webhook/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 🔍 Current Status

- **n8n Workflows**: Market Scanner updated with environment variables
- **Dashboard**: Live at https://www.thub.rajanmaher.com/dashboard
- **API**: Responding but webhook auth not yet configured
- **Issue**: Webhook returning 401 - Need to set N8N_WEBHOOK_SECRET in Vercel

## 📋 Next Steps

1. **URGENT**: Add N8N_WEBHOOK_SECRET to Vercel environment variables
2. Create n8n credentials as listed above
3. Import remaining workflows from deploy-ready folder
4. Test end-to-end connectivity
5. Enable production schedules

## 🎯 Success Criteria

- [ ] Webhook test returns 200 OK
- [ ] Market Scanner executes without errors
- [ ] Signals appear in dashboard
- [ ] All workflows running on schedule

---

**Last Updated**: September 17, 2025