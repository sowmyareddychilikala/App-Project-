/**
 * MediTrust k6 Load Testing Script
 * File: load-tests/k6-load-test.js
 * 
 * Usage:
 *   k6 run load-tests/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Ramp-up to 100 VUs
    { duration: '50s', target: 100 }, // Steady state with 100 VUs for remainder of 1 minute
    { duration: '5s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],                  // Error rate below 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://meditrust-4f425-default-rtdb.asia-southeast1.firebasedatabase.app';

export default function () {
  const endpoints = [
    `${BASE_URL}/pharmacies.json`,
    `${BASE_URL}/communityAlerts.json`,
    `${BASE_URL}/suspiciousMedicines.json`
  ];

  const target = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(target, {
    headers: { 'Accept': 'application/json' },
    tags: { name: 'GetDatabaseNodes' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  sleep(0.1); // Small think time to simulate 100 active concurrent users
}
