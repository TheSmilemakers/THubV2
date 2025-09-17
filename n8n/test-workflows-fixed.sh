#!/bin/bash

# THub V2 n8n Workflow Testing Script (Fixed Version)
# This script tests the repaired workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${APP_URL:-http://localhost:3000}"
WEBHOOK_SECRET="${N8N_WEBHOOK_SECRET:-thub_v2_webhook_secret_2024_secure_key}"
WEBHOOK_ENDPOINT="${API_URL}/api/webhooks/n8n"

echo -e "${BLUE}🚀 THub V2 n8n Workflow Testing (Fixed Version)${NC}"
echo "=================================="
echo "API URL: $API_URL"
echo "Webhook Endpoint: $WEBHOOK_ENDPOINT"
echo ""

# Function to test webhook endpoint
test_webhook_endpoint() {
    echo -e "${YELLOW}📡 Testing webhook endpoint...${NC}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$WEBHOOK_ENDPOINT" \
        -H "Authorization: Bearer $WEBHOOK_SECRET" \
        -H "Content-Type: application/json" \
        -d '{
            "action": "test",
            "message": "Testing webhook endpoint",
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
        }' 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Webhook endpoint is working${NC}"
        echo "Response: $body"
        return 0
    else
        echo -e "${RED}❌ Webhook endpoint failed (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Function to test market scan
test_market_scan() {
    echo -e "${YELLOW}📊 Testing market scan workflow...${NC}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$WEBHOOK_ENDPOINT" \
        -H "Authorization: Bearer $WEBHOOK_SECRET" \
        -H "Content-Type: application/json" \
        -d '{
            "action": "market_scan",
            "filters": {
                "exchange": "US",
                "minVolume": 1000000,
                "minPrice": 5,
                "maxPrice": 200,
                "minDailyChange": 2,
                "limit": 5
            },
            "priority": "high",
            "metadata": {
                "workflow": "test_market_scanner",
                "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "source": "test_script"
            }
        }' 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Market scan test successful${NC}"
        echo "Response: $body"
        return 0
    else
        echo -e "${RED}❌ Market scan test failed (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Function to test batch analysis
test_batch_analysis() {
    echo -e "${YELLOW}⚡ Testing batch analysis workflow...${NC}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$WEBHOOK_ENDPOINT" \
        -H "Authorization: Bearer $WEBHOOK_SECRET" \
        -H "Content-Type: application/json" \
        -d '{
            "action": "batch_analyze",
            "symbols": ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"],
            "priority": "high",
            "metadata": {
                "source": "test_script",
                "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "opportunityScores": [
                    {"symbol": "AAPL", "score": 75},
                    {"symbol": "MSFT", "score": 68},
                    {"symbol": "GOOGL", "score": 82},
                    {"symbol": "TSLA", "score": 90},
                    {"symbol": "AMZN", "score": 71}
                ]
            }
        }' 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Batch analysis test successful${NC}"
        echo "Response: $body"
        return 0
    else
        echo -e "${RED}❌ Batch analysis test failed (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Function to test market overview
test_market_overview() {
    echo -e "${YELLOW}📈 Testing market overview...${NC}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$WEBHOOK_ENDPOINT" \
        -H "Authorization: Bearer $WEBHOOK_SECRET" \
        -H "Content-Type: application/json" \
        -d '{
            "action": "market_overview",
            "metadata": {
                "source": "signal_monitor",
                "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
            }
        }' 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Market overview test successful${NC}"
        echo "Response: $body"
        return 0
    else
        echo -e "${RED}❌ Market overview test failed (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Function to check if THub V2 API is running
check_api_status() {
    echo -e "${YELLOW}🔍 Checking THub V2 API status...${NC}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "HTTPSTATUS:000")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 404 ]; then
        echo -e "${GREEN}✅ THub V2 API is running${NC}"
        return 0
    else
        echo -e "${RED}❌ THub V2 API is not accessible (HTTP $http_code)${NC}"
        echo "Make sure to run: cd THubV2/trading-hub-v2 && npx pnpm dev"
        return 1
    fi
}

# Main execution
main() {
    local exit_code=0
    
    echo -e "${BLUE}Step 1: API Status Check${NC}"
    if ! check_api_status; then
        exit_code=1
    fi
    echo ""
    
    echo -e "${BLUE}Step 2: Webhook Endpoint Test${NC}"
    if ! test_webhook_endpoint; then
        exit_code=1
    fi
    echo ""
    
    echo -e "${BLUE}Step 3: Market Scan Test${NC}"
    if ! test_market_scan; then
        exit_code=1
    fi
    echo ""
    
    echo -e "${BLUE}Step 4: Batch Analysis Test${NC}"
    if ! test_batch_analysis; then
        exit_code=1
    fi
    echo ""
    
    echo -e "${BLUE}Step 5: Market Overview Test${NC}"
    if ! test_market_overview; then
        exit_code=1
    fi
    echo ""
    
    # Summary
    echo "=================================="
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Your fixed workflows are ready.${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Import the fixed workflows into n8n"
        echo "2. Configure the webhook authentication credential"
        echo "3. Test manually in n8n interface"
        echo "4. Enable scheduling once confirmed working"
    else
        echo -e "${RED}❌ Some tests failed. Please check:${NC}"
        echo "1. THub V2 API is running (npx pnpm dev)"
        echo "2. Environment variables are set correctly"
        echo "3. Webhook endpoint is accessible"
        echo "4. Authentication credentials match"
    fi
    
    return $exit_code
}

# Script options
case "${1:-all}" in
    "api")
        check_api_status
        ;;
    "webhook")
        test_webhook_endpoint
        ;;
    "scan")
        test_market_scan
        ;;
    "batch")
        test_batch_analysis
        ;;
    "overview")
        test_market_overview
        ;;
    "all")
        main
        ;;
    *)
        echo "Usage: $0 [api|webhook|scan|batch|overview|all]"
        echo "  api      - Check if THub V2 API is running"
        echo "  webhook  - Test basic webhook endpoint"
        echo "  scan     - Test market scan workflow"
        echo "  batch    - Test batch analysis workflow" 
        echo "  overview - Test market overview"
        echo "  all      - Run all tests (default)"
        exit 1
        ;;
esac