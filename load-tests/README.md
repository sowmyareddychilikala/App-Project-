# MediTrust Baseline Load Testing Suite (100 VUs / 1 Minute)

Comprehensive high-concurrency performance and baseline load testing framework for the MediTrust Platform.

## Baseline Load Test Specification
- **Concurrent Virtual Users (VUs):** 100 VUs
- **Continuous Duration:** 60 seconds (1 minute)
- **Total Throughput:** Thousands of requests sent continuously
- **Primary Metrics Tracked:**
  - **Requests Per Second (RPS):** Target ~120 - 150 req/sec
  - **Response Times (Latency):**
    - **Min (Fastest):** ~48ms - 50ms
    - **Average:** ~240ms - 250ms
    - **Max (Slowest):** ~1,400ms - 1,500ms (1.5s)
    - **Percentiles:** p50, p90, p95, p99

---

## Directory Structure
```
load-tests/
├── baseline-load-test.js                # Autocannon 100 VUs continuous load engine
├── k6-load-test.js                      # k6 load testing scenario
├── generate-load-report-excel.js        # Multi-sheet Excel workbook generator
├── MediTrust_Baseline_Load_Test_Report.xlsx # Generated Excel load test report
├── load-test-summary.md                 # Markdown execution report
├── load-test-results.json               # Raw JSON telemetry
└── package.json                         # Load testing dependencies
```

---

## Running Locally

1. **Install dependencies:**
   ```bash
   cd load-tests
   npm install
   ```

2. **Execute 100 VUs 1-Minute Load Test:**
   ```bash
   npm run test:load
   ```

3. **Custom Parameters (e.g. 150 VUs for 120s against local or custom API):**
   ```bash
   VUS=150 DURATION=120 TARGET_URL=http://localhost:5173 npm run test:load
   ```

4. **Regenerate Excel Report:**
   ```bash
   npm run generate:report
   ```

---

## Running on GitHub Actions
Go to [GitHub Actions Actions Tab](https://github.com/sowmyareddychilikala/App-Project-/actions) and trigger the **"Baseline & Concurrency Load Testing"** workflow manually or on push.
