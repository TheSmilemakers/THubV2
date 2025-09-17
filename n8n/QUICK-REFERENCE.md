# THub V2 n8n Quick Reference Card

## 🚀 Daily Operations Checklist

### Morning (8:00 AM EST)
- [ ] Check overnight execution history
- [ ] Verify pre-market scanner ran at 8:30 AM
- [ ] Review any gap alerts
- [ ] Clear any failed executions

### Market Hours (9:30 AM - 4:00 PM EST)
- [ ] Monitor market scanner (runs every 30 min)
- [ ] Check signal notifications in Slack
- [ ] Verify batch analysis completing
- [ ] Watch for high-value signals (score ≥ 80)

### End of Day (4:30 PM EST)
- [ ] Review performance tracker report
- [ ] Check daily metrics in Slack
- [ ] Note any issues for tomorrow
- [ ] Verify all workflows active

## 🔧 Common Commands

### Local Testing Setup
```bash
# Terminal 1: Start Backend
cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
npx pnpm dev

# Terminal 2: Create ngrok tunnel (if needed)
ngrok http 3000

# Terminal 3: Run tests
./test-local-setup.sh
```

### Test Market Scan (Small)
```bash
# Local testing
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_scan","filters":{"limit":5}}'

# Production
curl -X POST https://your-app.vercel.app/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_scan","filters":{"limit":5}}'
```

### Test Batch Analysis
```bash
curl -X POST ${APP_URL}/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"batch_analyze","symbols":["AAPL","MSFT","GOOGL"]}'
```

### Get Market Overview
```bash
curl -X POST ${APP_URL}/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_overview"}'
```

## 📊 Key Metrics to Monitor

| Metric | Target | Alert If |
|--------|--------|----------|
| Scan Time | < 4 min | > 5 min |
| Candidates | 20-30 | < 10 or > 50 |
| Signals/Run | 3-5 | < 1 or > 10 |
| Error Rate | < 5% | > 10% |
| API Usage | < 80% | > 90% |

## 🚨 Troubleshooting Quick Fixes

### "Unauthorized" Error
```bash
# Check webhook secret matches exactly
echo $N8N_WEBHOOK_SECRET
# Should be: thub_v2_webhook_secret_2024_secure_key
```

### No Candidates Found
1. Check market hours (9:30 AM - 4:00 PM EST)
2. Verify EODHD API key is valid
3. Try with relaxed filters:
   ```json
   {"minVolume": 500000, "minDailyChange": 1}
   ```

### Timeout Errors
1. In n8n workflow, double-click HTTP Request node
2. Increase timeout: 30000 → 60000 (60 seconds)
3. Save workflow

### Workflow Not Running
1. Check schedule is active (toggle switch ON)
2. Verify timezone is "America/New_York"
3. Check execution history for errors

## 📱 Slack Commands

### Check Signal Count
```
/thub signals count
```

### Get Latest Signals
```
/thub signals latest
```

### Check API Usage
```
/thub api status
```

## 🔄 Workflow Status URLs

- **Execution History**: https://n8n.anikamaher.com/executions
- **Workflow List**: https://n8n.anikamaher.com/workflows
- **Credentials**: https://n8n.anikamaher.com/credentials
- **Variables**: https://n8n.anikamaher.com/settings/variables

## 📈 Performance Optimization

### If Scans Are Slow
1. Reduce limit temporarily: 30 → 20
2. Check API response times
3. Clear execution history > 7 days

### If Too Many/Few Signals
Adjust filters in Code node:
```javascript
// Too many signals? Increase thresholds
minDailyChange: 3,  // was 2
minVolume: 2000000  // was 1000000

// Too few signals? Decrease thresholds
minDailyChange: 1.5,  // was 2
minVolume: 500000    // was 1000000
```

### If API Limit Approaching
1. Increase scan interval: 30 min → 45 min
2. Reduce batch size: 10 → 5
3. Enable caching in Code nodes

## 🎯 Quality Indicators

### Good Signal Characteristics
- ✅ Score ≥ 70
- ✅ Volume > 2x average
- ✅ Price between $5-$200
- ✅ All 3 layers aligned

### Red Flags to Investigate
- ❌ Change > 100% (likely error)
- ❌ Volume < 10,000 shares
- ❌ Price < $1 (penny stock)
- ❌ Missing data fields

## 📞 Emergency Contacts

- **n8n Issues**: Check n8n.anikamaher.com status
- **API Issues**: Verify EODHD API status
- **Database Issues**: Check Supabase dashboard
- **Webhook Issues**: Test with curl commands above

## 🔐 Security Reminders

1. Never share webhook secret
2. Rotate credentials monthly
3. Monitor for unusual activity
4. Keep n8n version updated
5. Review access logs weekly

## 📅 Weekly Maintenance

Every Sunday:
1. [ ] Review week's performance metrics
2. [ ] Adjust filters based on results
3. [ ] Clear old execution data
4. [ ] Test all workflows manually
5. [ ] Update this reference if needed

---

**Remember**: Quality over quantity. Better to have 3 excellent signals than 30 mediocre ones!

**Last Updated**: [Date]
**Version**: 1.0