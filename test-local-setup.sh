#!/bin/bash

echo "🔍 THub V2 Local Testing Setup Verification"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backend is running
echo -n "1. Checking backend status... "
if curl -s -f http://localhost:3000/api/webhooks/n8n > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "   Start with: npx pnpm dev"
    exit 1
fi

# Test webhook endpoint
echo -n "2. Testing webhook endpoint... "
RESPONSE=$(curl -s http://localhost:3000/api/webhooks/n8n)
if [[ $RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Test authentication
echo -n "3. Testing authentication... "
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_overview"}')

if [ "$AUTH_TEST" == "200" ]; then
    echo -e "${GREEN}✓ Authenticated${NC}"
else
    echo -e "${RED}✗ Auth failed (HTTP $AUTH_TEST)${NC}"
    exit 1
fi

# Test market scan with tiny limit
echo -n "4. Testing market scan (1 symbol)... "
SCAN_RESULT=$(curl -s -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Authorization: Bearer thub_v2_webhook_secret_2024_secure_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"market_scan","filters":{"limit":1}}')

if [[ $SCAN_RESULT == *"success\":true"* ]]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo "   Scanned: $(echo $SCAN_RESULT | jq -r '.summary.totalScanned') symbols"
    echo "   Found: $(echo $SCAN_RESULT | jq -r '.summary.queued') candidates"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "   Response: $SCAN_RESULT"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Local setup ready for n8n testing!${NC}"
echo ""
echo "Next steps:"
echo "1. Open n8n.anikamaher.com"
echo "2. Set APP_URL = http://localhost:3000 (or use ngrok)"
echo "3. Import and test workflows"
echo ""
echo "For external access (if needed):"
echo "  ngrok http 3000"
echo "  Then use the ngrok URL in n8n"