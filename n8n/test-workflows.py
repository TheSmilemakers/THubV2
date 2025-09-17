#!/usr/bin/env python3
"""
THub V2 n8n Workflow Testing Script
Comprehensive testing for all production workflows
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple

# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

# n8n webhook base URL
N8N_BASE_URL = "https://n8n.anikamaher.com/webhook"

def test_simple_webhook() -> Tuple[bool, Dict]:
    """Test the simple webhook endpoint"""
    print(f"\n{Colors.BLUE}Test 1: Simple Webhook Test{Colors.RESET}")
    print(f"Endpoint: {N8N_BASE_URL}/thub-test")
    print("-" * 40)
    
    payload = {
        "test": "simple",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}/thub-test",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}✓ Success (200){Colors.RESET}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True, response.json()
        else:
            print(f"{Colors.RED}✗ Failed ({response.status_code}){Colors.RESET}")
            print(f"Response: {response.text}")
            return False, {"error": response.text, "status": response.status_code}
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.RESET}")
        return False, {"error": str(e)}

def test_deploy_ready_webhook() -> Tuple[bool, Dict]:
    """Test the deploy-ready webhook with API connectivity check"""
    print(f"\n{Colors.BLUE}Test 2: Deploy-Ready Webhook Test{Colors.RESET}")
    print(f"Endpoint: {N8N_BASE_URL}/test-webhook")
    print("-" * 40)
    
    payload = {
        "action": "test",
        "source": "python-test-script",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}/test-webhook",
            json=payload,
            timeout=15  # Longer timeout as it makes API call
        )
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}✓ Success (200){Colors.RESET}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True, response.json()
        else:
            print(f"{Colors.RED}✗ Failed ({response.status_code}){Colors.RESET}")
            print(f"Response: {response.text}")
            return False, {"error": response.text, "status": response.status_code}
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.RESET}")
        return False, {"error": str(e)}

def test_batch_analysis() -> Tuple[bool, Dict]:
    """Test batch analysis webhook"""
    print(f"\n{Colors.BLUE}Test 3: Batch Analysis Webhook{Colors.RESET}")
    print(f"Endpoint: {N8N_BASE_URL}/batch-analysis-trigger")
    print("-" * 40)
    
    payload = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "META", "NVDA"],
        "priority": "normal",
        "metadata": {
            "source": "python-test-script",
            "test": True,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }
    
    print(f"Testing with {len(payload['symbols'])} symbols: {', '.join(payload['symbols'])}")
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}/batch-analysis-trigger",
            json=payload,
            timeout=20  # Longer timeout for batch processing
        )
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}✓ Success (200){Colors.RESET}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True, response.json()
        else:
            print(f"{Colors.RED}✗ Failed ({response.status_code}){Colors.RESET}")
            print(f"Response: {response.text}")
            return False, {"error": response.text, "status": response.status_code}
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.RESET}")
        return False, {"error": str(e)}

def test_market_scan_action() -> Tuple[bool, Dict]:
    """Test market scan action via simple webhook"""
    print(f"\n{Colors.BLUE}Test 4: Market Scan Action Test{Colors.RESET}")
    print(f"Endpoint: {N8N_BASE_URL}/thub-test (with market_scan action)")
    print("-" * 40)
    
    payload = {
        "action": "market_scan",
        "filters": {
            "limit": 10,
            "minVolume": 1000000,
            "minPrice": 5,
            "maxPrice": 500
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}/thub-test",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}✓ Success (200){Colors.RESET}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if mock scan data is present
            if "mockScan" in data:
                print(f"\n{Colors.YELLOW}Mock scan results:{Colors.RESET}")
                print(f"  Total scanned: {data['mockScan']['totalScanned']}")
                print(f"  Filtered: {data['mockScan']['filtered']}")
                print(f"  Queued: {data['mockScan']['queued']}")
                print(f"  Candidates: {len(data['mockScan']['candidates'])}")
            
            return True, data
        else:
            print(f"{Colors.RED}✗ Failed ({response.status_code}){Colors.RESET}")
            print(f"Response: {response.text}")
            return False, {"error": response.text, "status": response.status_code}
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.RESET}")
        return False, {"error": str(e)}

def test_invalid_payload() -> Tuple[bool, Dict]:
    """Test error handling with invalid payload"""
    print(f"\n{Colors.BLUE}Test 5: Error Handling Test{Colors.RESET}")
    print("Testing batch analysis with invalid payload")
    print("-" * 40)
    
    payload = {
        "symbols": [],  # Empty symbols array should fail
        "priority": "normal"
    }
    
    try:
        response = requests.post(
            f"{N8N_BASE_URL}/batch-analysis-trigger",
            json=payload,
            timeout=10
        )
        
        # We expect this to fail
        if response.status_code != 200:
            print(f"{Colors.GREEN}✓ Correctly rejected invalid payload ({response.status_code}){Colors.RESET}")
            print(f"Response: {response.text}")
            return True, {"handled_correctly": True}
        else:
            print(f"{Colors.RED}✗ Accepted invalid payload - should have failed{Colors.RESET}")
            return False, response.json()
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.RESET}")
        return False, {"error": str(e)}

def show_scheduled_workflows():
    """Display information about scheduled workflows"""
    print(f"\n{Colors.YELLOW}{'=' * 60}")
    print("Scheduled Workflows Information")
    print('=' * 60 + Colors.RESET)
    
    print("\n1. Market Scanner (ID: fPC0yQPZZGK0nDyc)")
    print("   - Schedule: Every 30 minutes during market hours (9:30 AM - 4:00 PM EST)")
    print("   - Checks VIX for market volatility")
    print("   - Applies adaptive filters based on conditions")
    print("   - Can be manually triggered in n8n UI")
    
    print("\n2. Signal Monitor (ID: Vsm1O5ROZxCTKIBh)")
    print("   - Schedule: Every 15 minutes")
    print("   - Monitors active signals with score >= 70")
    print("   - Identifies signals needing refresh")
    print("   - Can be manually triggered in n8n UI")

def main():
    """Run all tests"""
    print(f"{Colors.BLUE}{'=' * 60}")
    print("THub V2 n8n Workflow Testing Suite")
    print('=' * 60 + Colors.RESET)
    
    results = []
    
    # Run all tests
    tests = [
        ("Simple Webhook", test_simple_webhook),
        ("Deploy-Ready Webhook", test_deploy_ready_webhook),
        ("Batch Analysis", test_batch_analysis),
        ("Market Scan Action", test_market_scan_action),
        ("Error Handling", test_invalid_payload)
    ]
    
    for test_name, test_func in tests:
        success, data = test_func()
        results.append((test_name, success))
        time.sleep(1)  # Small delay between tests
    
    # Show scheduled workflow info
    show_scheduled_workflows()
    
    # Summary
    print(f"\n{Colors.BLUE}{'=' * 60}")
    print("Test Summary")
    print('=' * 60 + Colors.RESET)
    
    successful = sum(1 for _, success in results if success)
    failed = sum(1 for _, success in results if not success)
    
    print(f"Total Tests: {len(results)}")
    print(f"{Colors.GREEN}Successful: {successful}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {failed}{Colors.RESET}")
    
    print("\nDetailed Results:")
    for test_name, success in results:
        status = f"{Colors.GREEN}✓{Colors.RESET}" if success else f"{Colors.RED}✗{Colors.RESET}"
        print(f"{status} {test_name}")
    
    # Next steps
    print(f"\n{Colors.YELLOW}Next Steps:{Colors.RESET}")
    print("1. Check n8n execution history at https://n8n.anikamaher.com")
    print("2. Verify scheduled workflows are active in n8n UI")
    print("3. Monitor THub V2 application logs for webhook processing")
    print("4. Test during market hours for realistic conditions")
    print("5. Check Vercel logs at https://vercel.com/dashboard")
    
    return successful == len(results)

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)