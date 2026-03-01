import { check, sleep } from 'k6';
import http from 'k6/http';

// Strict guardrails limit the burst to 50 users to prevent accidental DDoS while measuring responsiveness.
export const options = {
  stages: [
    { duration: '5s', target: 20 },  // Ramp up to 20 users over 5 seconds
    { duration: '10s', target: 50 }, // Hold 50 users (moderate burst constraint)
    { duration: '5s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    // 95% of requests must complete within 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate must be < 1%
    http_req_failed: ['rate<0.01'],
  },
};

const TARGET_URL = __ENV.TARGET_URL || 'https://app.questerix.com/';

export default function () {
  const res = http.get(TARGET_URL);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Short thinking time (1 second) to simulate realistic behavior without continuously bombarding from a single VU
  sleep(1);
}
