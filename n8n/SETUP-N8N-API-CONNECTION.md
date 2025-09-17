# Configure n8n API Connection for Direct Deployment

## Current Status
✅ n8n MCP server is running (node discovery works)  
❌ n8n API tools are not configured (can't deploy workflows directly)

## Setup n8n API Connection

### Step 1: Configure Environment Variables

Add these to your environment where the n8n MCP server runs:

```bash
# n8n Instance Configuration
export N8N_API_URL="https://your-n8n-instance.com"  # Your n8n URL
export N8N_API_KEY="your-api-key-here"              # Your API key

# Alternative: If running locally
# export N8N_API_URL="http://localhost:5678"
```

### Step 2: Restart n8n MCP Server

After setting environment variables, restart your MCP server so it picks up the new configuration.

### Step 3: Verify API Connection

Once configured, test the connection:

```bash
# This should work after configuration
claude mcp test n8n_health_check
```

## Once API is Connected

I'll be able to:

✅ **Direct Deployment**
- Deploy fixed workflows directly to your n8n instance
- Update existing workflows with patches
- Create new workflows programmatically

✅ **Live Management**
- List your existing workflows
- Validate workflows on your actual instance  
- Trigger test executions
- Monitor workflow health

✅ **Incremental Updates**
- Apply specific fixes to existing workflows
- Update individual nodes without recreating entire workflows
- Manage workflow settings and schedules

## Your n8n Instance Details Needed

To configure this properly, I need:

1. **n8n Instance URL**: `https://your-n8n-instance.com` (or localhost if running locally)
2. **API Key**: Your n8n API key
3. **Instance Version**: What version of n8n are you running?

Once you provide these details, I can either:
- Guide you through the MCP configuration
- Or proceed with manual import of the fixed workflows

## Alternative: Manual Import (Available Now)

If you prefer not to configure the API connection, you can manually import the fixed workflows I've already created:

1. **Download the fixed files from:**
   - `market-scanner-adaptive-fixed.json`
   - `batch-analysis-priority-fixed.json`
   - `webhook-test-simple.json`

2. **Import in n8n:**
   - Go to Workflows → Import
   - Upload each JSON file
   - Configure credentials as described in the Emergency Repair Guide

Which approach would you prefer?