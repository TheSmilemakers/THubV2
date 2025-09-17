#!/bin/bash

# THub V2 n8n Workflow Testing Script
# Tests all production workflows

echo "========================================"
echo "THub V2 n8n Workflow Testing"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for n8n webhooks
N8N_BASE_URL="https://n8n.anikamaher.com/webhook"

# Test 1: Simple Webhook Test
echo "Test 1: Simple Webhook Test"
echo "Testing webhook at: $N8N_BASE_URL/thub-test"
echo "----------------------------------------"

RESPONSE=$(curl -s -X POST "$N8N_BASE_URL/thub-test" \
  -H "Content-Type: application/json" \
  -d '{
    "test": "simple",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Simple webhook test successful${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ Simple webhook test failed${NC}"
fi

echo ""

# Test 2: Deploy-Ready Webhook Test
echo "Test 2: Deploy-Ready Webhook Test"
echo "Testing webhook at: $N8N_BASE_URL/test-webhook"
echo "----------------------------------------"

RESPONSE=$(curl -s -X POST "$N8N_BASE_URL/test-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test",
    "source": "test-script",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Deploy-ready webhook test successful${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ Deploy-ready webhook test failed${NC}"
fi

echo ""

# Test 3: Batch Analysis Webhook
echo "Test 3: Batch Analysis Webhook"
echo "Testing webhook at: $N8N_BASE_URL/batch-analysis-trigger"
echo "----------------------------------------"

RESPONSE=$(curl -s -X POST "$N8N_BASE_URL/batch-analysis-trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "MSFT", "GOOGL"],
    "priority": "normal",
    "metadata": {
      "source": "test-script"
    }
  }')

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Batch analysis webhook test successful${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ Batch analysis webhook test failed${NC}"
fi

echo ""

# Test 4: Market Scan Action (via simple webhook)
echo "Test 4: Market Scan Action Test"
echo "Testing market_scan action via simple webhook"
echo "----------------------------------------"

RESPONSE=$(curl -s -X POST "$N8N_BASE_URL/thub-test" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "market_scan",
    "filters": {
      "limit": 10
    }
  }')

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Market scan action test successful${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ Market scan action test failed${NC}"
fi

echo ""
echo "========================================"
echo "Note: Schedule-triggered workflows (Market Scanner, Signal Monitor)"
echo "cannot be tested directly via webhook but will run automatically"
echo "according to their schedules."
echo ""
echo "Market Scanner: Every 30 minutes during market hours"
echo "Signal Monitor: Every 15 minutes"
echo "========================================"