# n8n Production Environment Configuration

## Generated Webhook Secret
```
N8N_WEBHOOK_SECRET=7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05
```

## n8n Environment Variables
Configure these in n8n.anikamaher.com → Settings → Variables:

```bash
# Core Application
APP_URL=https://www.thub.rajanmaher.com
N8N_WEBHOOK_SECRET=7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05

# API Keys (replace with your actual key)
EODHD_API_KEY=YOUR_ACTUAL_EODHD_API_KEY_HERE

# Optional: Performance Tracking
PERFORMANCE_SHEET_ID=YOUR_GOOGLE_SHEET_ID_IF_USING
```

## Vercel Environment Variables
Ensure this is set in your Vercel dashboard:

```bash
N8N_WEBHOOK_SECRET=7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05
```

## n8n Credentials to Create

### 1. THub V2 Webhook Auth
- **Type**: HTTP Header Auth
- **Name**: THub V2 Webhook Auth
- **Header Name**: Authorization
- **Header Value**: Bearer 7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05

### 2. EODHD API Auth
- **Type**: HTTP Header Auth
- **Name**: EODHD API Auth
- **Header Name**: Authorization
- **Header Value**: Bearer YOUR_ACTUAL_EODHD_API_KEY_HERE

## Testing Commands

### Test Webhook Connectivity
```bash
curl -X POST https://www.thub.rajanmaher.com/api/webhooks/n8n \
  -H "Authorization: Bearer 7641222dea1ef40b4a65e16ac05e76ad7aec8fce6d8fb81333c90cda7f2d9a05" \
  -H "Content-Type: application/json" \
  -d '{"action": "market_overview"}'
```

### Test EODHD API
```bash
curl "https://eodhistoricaldata.com/api/real-time/AAPL.US?api_token=YOUR_EODHD_KEY&fmt=json"
```

## Security Note
⚠️ This file contains sensitive information. Do not commit to version control.
Add to .gitignore if not already excluded.