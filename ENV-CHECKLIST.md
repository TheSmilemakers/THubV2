# Environment Variables Checklist for THub V2 Deployment

This checklist ensures all required environment variables are properly configured before deployment.

## Required Environment Variables

### 1. Supabase Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - **Description**: Your Supabase project URL
  - **Format**: `https://[project-id].supabase.co`
  - **Where to find**: Supabase Dashboard > Settings > API

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **Description**: Public anonymous key for client-side access
  - **Format**: Long JWT token string
  - **Where to find**: Supabase Dashboard > Settings > API > anon public

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - **Description**: Service role key for server-side operations
  - **Format**: Long JWT token string
  - **Where to find**: Supabase Dashboard > Settings > API > service_role
  - **⚠️ SECURITY**: Keep this secret! Never expose in client code

### 2. Market Data API
- [ ] `EODHD_API_KEY`
  - **Description**: API key for EOD Historical Data
  - **Format**: Alphanumeric string
  - **Where to find**: EODHD.com > Account > API Tokens
  - **Usage Limits**: Check your plan's daily/monthly limits

### 3. n8n Webhook Security
- [ ] `N8N_WEBHOOK_SECRET`
  - **Description**: Secret token for authenticating n8n webhooks
  - **Format**: Strong random string (32+ characters)
  - **Generate**: `openssl rand -base64 32`
  - **Usage**: Must match the value in n8n HTTP Header Auth credential

### 4. Application Configuration
- [ ] `NEXT_PUBLIC_APP_URL`
  - **Description**: Full URL where your app is deployed
  - **Format**: `https://your-domain.com` (no trailing slash)
  - **Production**: `https://thub.rajanmaher.com`
  - **Development**: `http://localhost:3000`
  - **Staging**: `https://thub-staging.rajanmaher.com` (optional)

## Environment File Setup

### Development (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Market Data
EODHD_API_KEY=your-eodhd-api-key-here

# n8n Integration
N8N_WEBHOOK_SECRET=your-generated-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production Environment (.env.production)
NEXT_PUBLIC_APP_URL=https://thub.rajanmaher.com
```

### Production (Vercel Environment Variables)
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add each variable with appropriate values for production
3. Ensure sensitive keys are marked as "Secret"

## Security Checklist

- [ ] Never commit `.env.local` to version control
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Use different API keys for development and production
- [ ] Rotate webhook secrets periodically
- [ ] Monitor API usage to prevent overage charges

## Validation Steps

1. **Test Supabase Connection**:
   ```bash
   npm run dev
   # Visit http://localhost:3000 and check console for errors
   ```

2. **Test EODHD API**:
   ```bash
   # Check API key validity in the app's market data features
   ```

3. **Test n8n Webhook**:
   ```bash
   # Use the test webhook endpoint
   curl -X POST http://localhost:3000/api/webhooks/n8n \
     -H "Authorization: Bearer YOUR_N8N_WEBHOOK_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"action": "test"}'
   ```

## Troubleshooting

### Common Issues:
1. **"Invalid API Key" errors**: Double-check key format and no extra spaces
2. **"Supabase connection failed"**: Verify URL format and both keys are set
3. **"Webhook unauthorized"**: Ensure N8N_WEBHOOK_SECRET matches in both systems
4. **"CORS errors"**: Check NEXT_PUBLIC_APP_URL matches actual deployment URL

### Debug Commands:
```bash
# Check if environment variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Verify .env.local is being read
npm run dev -- --verbose
```

## Pre-Deployment Checklist

- [ ] All environment variables set in `.env.local`
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Local development server runs without errors
- [ ] API connections tested successfully
- [ ] Production environment variables configured in Vercel
- [ ] Webhook secret is strong and unique
- [ ] API rate limits understood and monitored

## Post-Deployment Verification

- [ ] Production app loads without console errors
- [ ] Database connection works (check user auth)
- [ ] Market data loads (check dashboard)
- [ ] n8n webhooks respond (test with simple workflow)
- [ ] No sensitive keys exposed in browser network tab

---

**Last Updated**: January 2025
**Next Steps**: Once all variables are configured, proceed with n8n workflow deployment