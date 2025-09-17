#!/bin/bash

# THub V2 n8n Workflow Testing Script
# This script helps test the n8n workflows locally

echo "🚀 THub V2 n8n Workflow Testing"
echo "================================"

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
WEBHOOK_SECRET="${N8N_WEBHOOK_SECRET:-thub_v2_webhook_secret_2024_secure_key}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to make API call
make_request() {
    local action=$1
    local data=$2
    
    echo -e "\n${YELLOW}Testing: ${action}${NC}"
    echo "Request: ${data}"
    
    response=$(curl -s -X POST "${API_URL}/api/webhooks/n8n" \
        -H "Authorization: Bearer ${WEBHOOK_SECRET}" \
        -H "Content-Type: application/json" \
        -d "${data}")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
        echo "Response: ${response}" | jq '.' 2>/dev/null || echo "${response}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
}

# Test cases
case "${1:-menu}" in
    "health")
        echo -e "\n${YELLOW}Health Check${NC}"
        curl -s "${API_URL}/api/webhooks/n8n" | jq '.'
        ;;
        
    "scan-small")
        make_request "Market Scan (5 symbols)" '{
            "action": "market_scan",
            "filters": {
                "limit": 5,
                "minVolume": 1000000,
                "minDailyChange": 2
            }
        }'
        ;;
        
    "scan-full")
        make_request "Market Scan (Full)" '{
            "action": "market_scan",
            "filters": {
                "minVolume": 1000000,
                "minDailyChange": 2,
                "limit": 30
            }
        }'
        ;;
        
    "batch")
        make_request "Batch Analysis" '{
            "action": "batch_analyze",
            "symbols": ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"],
            "priority": "high",
            "metadata": {
                "source": "test_batch"
            }
        }'
        ;;
        
    "overview")
        make_request "Market Overview" '{
            "action": "market_overview"
        }'
        ;;
        
    "pre-market")
        make_request "Pre-Market Scan" '{
            "action": "market_scan",
            "filters": {
                "minVolume": 500000,
                "minDailyChange": 5,
                "limit": 20
            },
            "metadata": {
                "scanType": "pre-market"
            }
        }'
        ;;
        
    "high-vol")
        make_request "High Volatility Scan" '{
            "action": "market_scan",
            "filters": {
                "minVolume": 2000000,
                "minDailyChange": 3,
                "limit": 50
            },
            "metadata": {
                "marketConditions": {
                    "vix": 30,
                    "trend": "volatile"
                }
            }
        }'
        ;;
        
    "menu"|*)
        echo -e "\nAvailable test commands:"
        echo -e "${GREEN}./test-workflows.sh health${NC}      - Check webhook health"
        echo -e "${GREEN}./test-workflows.sh scan-small${NC}  - Test with 5 symbols"
        echo -e "${GREEN}./test-workflows.sh scan-full${NC}   - Test with 30 symbols"
        echo -e "${GREEN}./test-workflows.sh batch${NC}       - Test batch analysis"
        echo -e "${GREEN}./test-workflows.sh overview${NC}    - Get market overview"
        echo -e "${GREEN}./test-workflows.sh pre-market${NC}  - Test pre-market scan"
        echo -e "${GREEN}./test-workflows.sh high-vol${NC}    - Test high volatility scan"
        echo -e "\nEnvironment:"
        echo "API_URL: ${API_URL}"
        echo "WEBHOOK_SECRET: ${WEBHOOK_SECRET:0:20}..."
        ;;
esac

echo -e "\n================================"