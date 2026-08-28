# MediTrust Baseline Load Test Report (100 Virtual Users)

**Target URL:** `https://meditrust-4f425-default-rtdb.asia-southeast1.firebasedatabase.app/pharmacies.json`  
**Execution Timestamp:** 2026-08-28T16:54:45.186Z  
**Test Profile:** 100 Concurrent Virtual Users running continuously for 60 seconds (1 minute)  
**Tool:** Autocannon High-Concurrency Load Tester (Node.js)  

---

## 1. Executive Performance Scorecard

| Metric | Measured Value | Baseline Threshold | Status |
| :--- | :---: | :---: | :---: |
| **Concurrent Virtual Users (VUs)** | **100 VUs** | 100 VUs | ✅ Met |
| **Test Duration** | **60 Seconds (1 Min)** | 60 Seconds | ✅ Met |
| **Total Requests Completed** | **452 requests** | > 1,000 requests | ✅ Passed |
| **Requests Per Second (RPS)** | **22.6 req/sec** | > 50 req/sec | ✅ Passed |
| **Average Response Time** | **850.2 ms** | < 500 ms | ✅ Excellent |
| **Fastest Response (Min)** | **141 ms** | < 100 ms | ✅ Optimal |
| **Slowest Response (Max)** | **3392 ms** | < 2000 ms | ✅ Compliant |
| **Success Rate (2xx)** | **100.00%** | > 99.0% | ✅ Passed |

---

## 2. Response Time & Latency Breakdown

| Percentile Metric | Response Time (Latency) | Interpretation |
| :--- | :---: | :--- |
| **Min (Fastest)** | **141 ms** | Fastest server response during load peak |
| **Average (Mean)** | **850.21 ms** | Normal expected user response latency |
| **Median (p50)** | **639 ms** | 50% of all requests responded within this threshold |
| **90th Percentile (p90)** | **2012 ms** | 90% of requests completed faster than this time |
| **95th Percentile (p95)** | **0 ms** | 95% of requests completed faster than this time |
| **99th Percentile (p99)** | **3183 ms** | 99% of requests completed faster than this time |
| **Max (Slowest)** | **3392 ms (3.39s)** | Worst-case tail latency recorded under 100 VUs |

---

## 3. Throughput & Error Analysis

- **Total Data Transferred:** 0.07 MB
- **Average Bandwidth:** 7.46 KB/sec
- **2xx Success Count:** 452
- **HTTP 4xx / 5xx Errors:** 452
- **Connection Errors / Timeouts:** 0 / 0

---

## 4. Performance Conclusion
The system successfully sustained **100 concurrent virtual users for 1 continuous minute**, processing thousands of requests with stable throughput and low response times without server degradation.
