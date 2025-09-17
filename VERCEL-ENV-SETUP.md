# Vercel Environment Variables Setup Guide

## 🎯 Quick Setup for Vercel Deployment

This guide will help you securely add all required environment variables to your Vercel deployment.

## 📋 Required Environment Variables

Copy these variable names and add them in Vercel Dashboard > Settings > Environment Variables:

### 1. Supabase Configuration (3 variables)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 2. Market Data API (1 variable)

```
EODHD_API_KEY
```

### 3. n8n Integration (1 variable)

```
N8N_WEBHOOK_SECRET
```

### 4. Application URL (1 variable)

```
NEXT_PUBLIC_APP_URL
```

## 🔧 Step-by-Step Setup in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your THub V2 project

2. **Open Environment Variables**
   - Click on "Settings" tab
   - Select "Environment Variables" from sidebar

3. **Add Each Variable**
   
   For each variable, click "Add New" and enter:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project-id.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   
   **Variable 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   
   **Variable 3:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your service key)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - ⚠️ Mark as: **Sensitive** (click the eye icon)
   
   **Variable 4:**
   - Key: `EODHD_API_KEY`
   - Value: `your-eodhd-api-key-here`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - ⚠️ Mark as: **Sensitive**
   
   **Variable 5:**
   - Key: `N8N_WEBHOOK_SECRET`
   - Value: Generate with: `openssl rand -base64 32`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - ⚠️ Mark as: **Sensitive**
   
   **Variable 6:**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://thub.rajanmaher.com`
   - Environment: ✅ Production
   - Preview Value: `https://$VERCEL_URL`
   - Development Value: `http://localhost:3000`

### Method 2: Vercel CLI (Alternative)

If you prefer using the command line:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add EODHD_API_KEY
vercel env add N8N_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### Method 3: Bulk Import (Fastest)

1. Create a file called `.env.production` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EODHD_API_KEY=your-eodhd-api-key-here
N8N_WEBHOOK_SECRET=your-generated-secret-here
NEXT_PUBLIC_APP_URL=https://thub.rajanmaher.com
```

2. **Import to Vercel**:
   - In Vercel Dashboard > Settings > Environment Variables
   - Click "Import from .env"
   - Select your `.env.production` file
   - Choose environments (Production, Preview, Development)
   - Click "Import"

3. **⚠️ IMPORTANT**: Delete `.env.production` after import!

## 🔐 Security Best Practices

### Mark as Sensitive
Always mark these variables as **Sensitive** in Vercel:
- `SUPABASE_SERVICE_ROLE_KEY`
- `EODHD_API_KEY`
- `N8N_WEBHOOK_SECRET`

### Different Values per Environment
Consider using different values for:
- **Production**: Real API keys and production URLs
- **Preview**: Test API keys with lower limits
- **Development**: Local development keys

### Generating Secure Secrets

**For N8N_WEBHOOK_SECRET**:
```bash
# macOS/Linux
openssl rand -base64 32

# Alternative (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Example output: xK9mP2vL8nQ4wR7tY5uZ3aB6cE1fH9jI1234567890=
```

## 📍 Where to Find Your Values

### Supabase Values
1. Log in to https://supabase.com
2. Select your project
3. Go to Settings > API
4. Find:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`

### EODHD API Key
1. Log in to https://eodhd.com
2. Go to Account > API Tokens
3. Copy your API key

### Application URL
- Production: `https://thub.rajanmaher.com`
- Staging: `https://thub-staging.vercel.app`
- Preview: Use `https://$VERCEL_URL` (dynamic)

## ✅ Verification Steps

After adding all environment variables:

1. **Trigger a new deployment**:
   ```bash
   vercel --prod
   ```
   Or push a commit to trigger automatic deployment

2. **Check deployment logs**:
   - Vercel Dashboard > Functions tab
   - Look for any environment variable errors

3. **Test the deployment**:
   ```bash
   # Test health endpoint
   curl https://thub.rajanmaher.com/api/health
   
   # Test webhook health
   curl https://thub.rajanmaher.com/api/webhooks/n8n/health
   ```

## 🚨 Common Issues

### "Environment variable not found"
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding variables
- Check if variable is available in the correct environment

### "Invalid API key" errors
- Verify no extra spaces in values
- Check if keys are for the correct environment
- Ensure keys haven't expired

### "CORS errors"
- Verify `NEXT_PUBLIC_APP_URL` matches your actual domain
- Include protocol (https://) in the URL
- No trailing slash

## 📱 Quick Copy List

For easy copying, here are all variable names:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
EODHD_API_KEY
N8N_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

## 🎯 Final Checklist

- [ ] All 6 environment variables added
- [ ] Sensitive variables marked as secret
- [ ] Production URL set correctly
- [ ] n8n webhook secret generated (32+ chars)
- [ ] Deployment triggered after adding variables
- [ ] Health endpoints tested successfully
- [ ] No environment errors in deployment logs

Once all variables are set, your THub V2 will be ready for production use! 🚀

---

**Need Help?**
- Check Vercel docs: https://vercel.com/docs/environment-variables
- Review error logs in Vercel Dashboard > Functions
- Ensure all values are copied without extra spaces