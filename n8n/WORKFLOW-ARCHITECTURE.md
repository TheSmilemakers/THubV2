# THub V2 n8n Workflow Architecture

## System Overview

```mermaid
graph TB
    subgraph "Scheduled Triggers"
        MS[Market Scanner<br/>Every 30 min]
        PM[Pre-Market Scanner<br/>8:30 AM]
        SM[Signal Monitor<br/>Every 15 min]
        PT[Performance Tracker<br/>4:30 PM Daily]
    end

    subgraph "THub V2 API"
        WH[Webhook Endpoint<br/>/api/webhooks/n8n]
        DB[(Database)]
    end

    subgraph "Processing Workflows"
        BA[Batch Analysis<br/>Priority Queue]
        QC[Quality Control]
        AF[Adaptive Filters]
    end

    subgraph "Outputs"
        SL[Slack Notifications]
        GS[Google Sheets]
        SIG[Trading Signals]
    end

    MS -->|market_scan| WH
    PM -->|market_scan| WH
    SM -->|market_overview| WH
    
    WH -->|candidates| BA
    WH -->|scan results| DB
    
    BA -->|batch_analyze| WH
    WH -->|signals| DB
    
    DB -->|active signals| SM
    DB -->|metrics| PT
    
    BA --> SIG
    SIG --> SL
    PT --> GS
    PT --> SL
    
    MS --> QC
    QC --> AF
    AF --> MS
```

## Detailed Workflow Interactions

### 1. Market Scanning Flow

```mermaid
sequenceDiagram
    participant Cron as n8n Schedule
    participant MS as Market Scanner
    participant API as THub V2 API
    participant DB as Database
    participant BA as Batch Analysis
    participant Slack as Notifications

    Cron->>MS: Trigger (*/30 min)
    MS->>MS: Check Market Status
    MS->>MS: Apply Adaptive Filters
    MS->>API: POST /webhooks/n8n<br/>{action: "market_scan"}
    API->>API: Scan 11,000+ symbols
    API->>DB: Store candidates
    API-->>MS: Return top 30
    MS->>MS: Quality Control
    MS->>BA: Trigger analysis
    BA->>API: POST /webhooks/n8n<br/>{action: "batch_analyze"}
    API->>DB: Create signals
    API-->>BA: Return results
    BA->>Slack: Notify high-value signals
```

### 2. Adaptive Filter Logic

```mermaid
graph LR
    MC[Market Conditions] --> VIX{VIX Level?}
    VIX -->|">25"| HV[High Volatility<br/>Min Volume: 2M<br/>Min Change: 3%]
    VIX -->|"15-25"| NV[Normal<br/>Min Volume: 1M<br/>Min Change: 2%]
    VIX -->|"<15"| LV[Low Volatility<br/>Min Volume: 1M<br/>Min Change: 1.5%]
    
    HV --> F[Final Filters]
    NV --> F
    LV --> F
    
    TOD[Time of Day] --> F
    F --> SCAN[Market Scan]
```

### 3. Signal Quality Pipeline

```mermaid
graph LR
    SCAN[Market Scan] -->|11,000+ symbols| FILTER[Pre-Filter]
    FILTER -->|300-500 pass| SCORE[Opportunity Score]
    SCORE -->|Top 30| QUEUE[Analysis Queue]
    QUEUE --> CONV[3-Layer Convergence]
    CONV -->|Score ≥70| SIGNAL[Create Signal]
    SIGNAL --> NOTIFY[Notifications]
    
    subgraph "Scoring Algorithm"
        V[Volume: 30%]
        M[Momentum: 40%]
        L[Liquidity: 30%]
    end
    
    V --> SCORE
    M --> SCORE
    L --> SCORE
```

## Workflow Configurations

### Market Scanner Settings

| Parameter | Default | High Volatility | Pre-Market |
|-----------|---------|----------------|------------|
| Min Volume | 1M | 2M | 500K |
| Min Price | $5 | $5 | $5 |
| Max Price | $500 | $500 | $500 |
| Min Change | 2% | 3% | 5% |
| Scan Limit | 30 | 50 | 20 |
| Schedule | */30 9-16 * * 1-5 | Same | 30 8 * * 1-5 |

### Quality Control Thresholds

| Check | Threshold | Action |
|-------|-----------|---------|
| Max Daily Change | 100% | Filter out |
| Min Volume | 10,000 | Filter out |
| Min Price | $1 | Filter out |
| Volume Spike | 50x normal | Flag for review |
| Missing Data | Any required field | Skip symbol |

## Performance Metrics

### Target KPIs

```yaml
Operational:
  - Scan Completion: < 4 minutes
  - Error Rate: < 5%
  - API Usage: < 80% of limit
  - Uptime: > 99%

Quality:
  - Candidates per Scan: 20-30
  - Signals per Run: 3-5
  - Signal Accuracy: > 70%
  - False Positive Rate: < 20%

Efficiency:
  - Scan-to-Signal: < 10 minutes
  - Notification Delay: < 30 seconds
  - Database Writes: < 1000/scan
```

## Data Flow Examples

### Example 1: High-Value Signal Discovery

```
Time: 10:30 AM
Market Condition: VIX = 28 (High Volatility)

1. Scanner applies strict filters:
   - Min Volume: 2,000,000
   - Min Change: 3%
   - Limit: 50 candidates

2. Discovers BMNR:
   - Price: $3.85
   - Volume: 48M (vs 376K avg)
   - Change: +126%
   - Opportunity Score: 73

3. Analysis triggered:
   - Technical Score: 82
   - Sentiment Score: 68
   - Liquidity Score: 71
   - Convergence: 74 (STRONG)

4. Signal created and notification sent
```

### Example 2: Pre-Market Gap Detection

```
Time: 8:30 AM
Scan Type: Pre-Market Gaps

1. Scanner finds 15 gaps > 5%
2. Categorizes:
   - 2 Extreme gaps (>10%)
   - 5 Strong gaps (5-10%)
   - 8 Moderate gaps (3-5%)

3. Priority analysis on extreme gaps
4. Alerts sent before market open
```

## Monitoring Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│                  Daily Summary                       │
├─────────────────┬───────────────┬──────────────────┤
│ Total Scans: 16 │ Candidates: 412│ Signals: 42     │
│ Success: 94%    │ Avg Time: 3.2s │ Strong: 12      │
└─────────────────┴───────────────┴──────────────────┘

┌─────────────────────────────────────────────────────┐
│                 Execution Timeline                   │
│  9:30 ████ 10:00 ████ 10:30 ████ 11:00 ███▓      │
│  ✓✓✓✓     ✓✓✓✓      ✓✓✓✓      ✓✓✓✗              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  Quality Metrics                     │
├─────────────────────────┬───────────────────────────┤
│ Scan→Signal Rate: 10.2% │ API Usage: 44.5%         │
│ Avg Score: 72.3         │ Error Rate: 1.8%         │
│ High-Value Ratio: 28.6% │ Filter Effect: 85%       │
└─────────────────────────┴───────────────────────────┘
```

## Security Considerations

1. **Authentication**: All webhook calls use Bearer token
2. **Rate Limiting**: Built into THub V2 API
3. **Data Privacy**: No sensitive data in logs
4. **Error Handling**: Failures don't expose system details
5. **Access Control**: n8n credentials are encrypted

## Scaling Considerations

### Current Capacity
- Handles 11,000+ symbols per scan
- Processes in ~3.3 seconds
- Supports 48 scans/day (every 30 min)

### Future Scaling Options
1. **Horizontal**: Multiple n8n instances for different markets
2. **Vertical**: Increase batch processing size
3. **Caching**: Redis layer for frequently accessed data
4. **Queue**: Separate queue service for high volume

## Maintenance Windows

Recommended maintenance schedule:
- **Daily**: 5:00-5:30 AM EST (before pre-market)
- **Weekly**: Sunday evening
- **Monthly**: First Sunday of month

During maintenance:
1. Disable all schedules
2. Backup workflow configurations
3. Clear execution history > 30 days
4. Update n8n if needed
5. Test workflows before re-enabling

---

This architecture is designed for reliability, scalability, and continuous improvement through adaptive filtering and performance tracking.