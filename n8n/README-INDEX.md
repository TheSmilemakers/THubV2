# THub V2 n8n Documentation Index

This index provides the recommended reading order for setting up n8n workflows on n8n.anikamaher.com.

## 🚀 Quick Start Path (For Immediate Setup)

If you want to start testing immediately, follow these documents in order:

### 1. **LOCAL-TESTING-GUIDE.md** ⭐ START HERE
- Complete guide for testing with local backend
- No deployment required
- ngrok setup instructions
- Quick verification steps

### 2. **SETUP-CHECKLIST.md** ✅
- Step-by-step checklist format
- Check off items as you complete them
- Includes local testing options
- Quick reference for all setup tasks

### 3. **test-workflows.sh** 🧪
- Ready-to-use test commands
- Run `./n8n/test-workflows.sh` for menu
- Tests all webhook endpoints
- Validates your setup quickly

## 📚 Complete Documentation Set

### Setup & Configuration

1. **N8N-WORKFLOW-SETUP-GUIDE.md** 📖
   - Comprehensive setup instructions
   - Detailed explanations for each step
   - Screenshots and examples
   - Troubleshooting section

2. **LOCAL-TESTING-GUIDE.md** 🏠
   - Focus on local development
   - ngrok configuration
   - No deployment needed
   - Best practices for local testing

3. **SETUP-CHECKLIST.md** ✅
   - Actionable checklist format
   - Track your progress
   - Nothing missed

### Workflow Details

4. **README.md** 📋
   - Overview of all workflows
   - Directory structure explanation
   - Individual workflow descriptions
   - Performance optimization tips

5. **WORKFLOW-ARCHITECTURE.md** 🏗️
   - System design diagrams
   - Data flow visualizations
   - Integration patterns
   - Scaling considerations

### Configuration Files

6. **adaptive-filters.js** ⚙️
   - Dynamic filter logic
   - Market condition adaptations
   - Scoring algorithms
   - Performance targets

### Testing & Operations

7. **test-workflows.sh** 🧪
   - Executable test script
   - Multiple test scenarios
   - Easy command-line interface

8. **test-local-setup.sh** 🔍
   - Verify local backend
   - Check all connections
   - Quick health assessment

9. **test-payloads/** 📦
   - Example JSON payloads
   - Various test scenarios
   - Copy-paste ready

### Daily Operations

10. **QUICK-REFERENCE.md** 📇
    - Daily checklist
    - Common commands
    - Key metrics
    - Quick fixes

11. **TROUBLESHOOTING-GUIDE.md** 🔧
    - Decision trees
    - Common issues
    - Step-by-step solutions
    - Emergency procedures

### Workflow JSON Files

12. **workflows/core/** 🔄
    - market-scanner-adaptive.json
    - batch-analysis-priority.json
    - signal-monitor-realtime.json

13. **workflows/advanced/** 🚀
    - pre-market-scanner.json

14. **workflows/monitoring/** 📊
    - performance-tracker.json

## 🎯 Use Cases

### "I want to test immediately"
1. Read LOCAL-TESTING-GUIDE.md
2. Run test-local-setup.sh
3. Follow SETUP-CHECKLIST.md

### "I need to understand the system"
1. Read README.md
2. Review WORKFLOW-ARCHITECTURE.md
3. Study adaptive-filters.js

### "Something isn't working"
1. Check TROUBLESHOOTING-GUIDE.md
2. Run test-workflows.sh
3. Review execution logs

### "I'm ready for production"
1. Complete all items in SETUP-CHECKLIST.md
2. Review N8N-WORKFLOW-SETUP-GUIDE.md production section
3. Monitor with QUICK-REFERENCE.md

## 💡 Pro Tips

1. **Start Local**: Always test with local backend first
2. **Use ngrok**: Makes external access simple
3. **Small Tests**: Begin with 5-symbol limits
4. **Check Logs**: Backend console shows everything
5. **Save URLs**: Note your ngrok URL when testing

## 📞 Quick Commands

```bash
# Start backend
cd /Users/rajan/Documents/THub/THubV2/trading-hub-v2
npx pnpm dev

# Create tunnel
ngrok http 3000

# Run tests
./test-local-setup.sh
./n8n/test-workflows.sh menu

# Check health
curl http://localhost:3000/api/webhooks/n8n
```

## 🎉 Success Criteria

You'll know setup is complete when:
- ✅ Workflows execute without errors
- ✅ Data appears in Supabase
- ✅ Market scan finds candidates
- ✅ Signals are generated
- ✅ No red nodes in n8n

---

**Remember**: Local testing first, deployment later. This approach saves time and ensures everything works perfectly!