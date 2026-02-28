/**
 * Questerix k6 Load Test — Login Spike
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates that the Supabase GoTrue auth endpoint (via Supavisor connection
 * pooling) handles a sudden spike of 50,000 concurrent login requests without
 * exceeding SLA thresholds.
 *
 * Scenario design:
 *   - Ramp from 0 → PEAK_VUS over RAMP_DURATION (default 2m).
 *   - Sustain PEAK_VUS for SUSTAIN_DURATION (default 5m).
 *   - Ramp down to 0 over RAMP_DOWN_DURATION (default 1m).
 *
 * Each VU performs:
 *   1. POST /auth/v1/token?grant_type=password   — login
 *   2. GET  /rest/v1/profiles?id=eq.{user_id}    — read own profile (common
 *      first action after login; validates Supavisor DB connection under load)
 *   3. POST /auth/v1/logout                       — clean session termination
 *
 * Gate (CI fails if any threshold is breached):
 *   - P95 latency < 500ms
 *   - P99 latency < 2,000ms
 *   - Failure rate < 0.1%
 *   - Check rate ≥ 99%
 *
 * Run locally (requires k6 installed):
 *   k6 run questerix-cortex/performance/login_spike.js \
 *     --env SUPABASE_ANON_KEY=<key> \
 *     --env K6_TEST_EMAIL=loadtest@questerix.com \
 *     --env K6_TEST_PASSWORD=LoadTest!!1
 *
 * Reduce scale for local smoke test:
 *   k6 run --vus 100 --duration 30s questerix-cortex/performance/login_spike.js
 */

import { check, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";
import {
    ANON_KEY,
    PEAK_VUS,
    RAMP_DOWN_DURATION,
    RAMP_DURATION,
    SUPABASE_URL,
    SUSTAIN_DURATION,
    TEST_EMAIL,
    TEST_PASSWORD,
    THRESHOLDS,
    anonHeaders,
    authHeaders,
} from "./config.js";

// ── Custom metrics ────────────────────────────────────────────────────────────

const loginSuccessRate = new Rate("login_success_rate");
const profileReadLatency = new Trend("profile_read_latency_ms");
const logoutSuccessRate = new Rate("logout_success_rate");

// ── Test options ──────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        // Ramp up aggressively — simulates school day start (bell rings, everyone logs in)
        { duration: RAMP_DURATION, target: PEAK_VUS },
        // Sustain peak — all students active simultaneously
        { duration: SUSTAIN_DURATION, target: PEAK_VUS },
        // Ramp down
        { duration: RAMP_DOWN_DURATION, target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    ...THRESHOLDS,
    // Additional per-metric thresholds for login-specific SLAs
    login_success_rate: ["rate>=0.99"],
    logout_success_rate: ["rate>=0.98"],
    // Profile read should be sub-200ms when DB is not under write pressure
    profile_read_latency_ms: ["p(95)<300"],
  },
};

// ── Test lifecycle ────────────────────────────────────────────────────────────

/**
 * setup() runs once before all VUs start.
 * Validates connectivity and returns shared data for use in default().
 */
export function setup() {
  // Validate the anon key is present
  if (!ANON_KEY) {
    console.warn(
      "[WARN] SUPABASE_ANON_KEY not set — requests will be rejected with 401. " +
        "Set via --env SUPABASE_ANON_KEY=<value>"
    );
  }

  // Probe the auth endpoint with a single request to catch config errors early
  const probeRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: anonHeaders() }
  );

  if (probeRes.status !== 200) {
    console.warn(
      `[WARN] Setup probe login returned ${probeRes.status}. ` +
        "Check K6_TEST_EMAIL / K6_TEST_PASSWORD. Tests will still run but logins may fail."
    );
    return { probePassed: false };
  }

  const body = JSON.parse(probeRes.body);
  console.log(
    `[OK] Setup probe passed. user_id=${body.user?.id ?? "unknown"}`
  );
  return { probePassed: true };
}

/**
 * default() is executed by every VU for every iteration.
 */
export default function (data) {
  // ── Step 1: Login ──────────────────────────────────────────────────────────
  const loginStart = Date.now();
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    {
      headers: anonHeaders(),
      tags: { operation: "login" },
    }
  );

  const loginOk = check(loginRes, {
    "login: status 200": (r) => r.status === 200,
    "login: access_token present": (r) => {
      try {
        return JSON.parse(r.body)?.access_token?.length > 0;
      } catch {
        return false;
      }
    },
    "login: response time < 500ms": (r) => r.timings.duration < 500,
  });

  loginSuccessRate.add(loginOk);

  if (!loginOk || loginRes.status !== 200) {
    // Don't attempt profile read or logout if login failed
    sleep(1);
    return;
  }

  let accessToken;
  let userId;
  try {
    const body = JSON.parse(loginRes.body);
    accessToken = body.access_token;
    userId = body.user?.id;
  } catch {
    loginSuccessRate.add(false);
    sleep(1);
    return;
  }

  // ── Step 2: Read own profile (Supavisor DB hop) ───────────────────────────
  const profileStart = Date.now();
  const profileRes = http.get(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,role,email,app_id`,
    {
      headers: authHeaders(accessToken),
      tags: { operation: "profile_read" },
    }
  );

  profileReadLatency.add(Date.now() - profileStart);

  check(profileRes, {
    "profile: status 200": (r) => r.status === 200,
    "profile: non-empty response": (r) => {
      try {
        return JSON.parse(r.body)?.length > 0;
      } catch {
        return false;
      }
    },
    "profile: response time < 300ms": (r) => r.timings.duration < 300,
  });

  // ── Step 3: Logout (session cleanup) ─────────────────────────────────────
  const logoutRes = http.post(
    `${SUPABASE_URL}/auth/v1/logout`,
    null,
    {
      headers: authHeaders(accessToken),
      tags: { operation: "logout" },
    }
  );

  const logoutOk = check(logoutRes, {
    "logout: status 204": (r) => r.status === 204 || r.status === 200,
  });
  logoutSuccessRate.add(logoutOk);

  // Brief think time — realistic user pacing (students don't hammer auth)
  sleep(Math.random() * 2 + 0.5); // 0.5s–2.5s
}

/**
 * teardown() runs once after all VUs complete.
 */
export function teardown(data) {
  console.log("[DONE] Login spike test complete.");
  if (!data.probePassed) {
    console.log(
      "[WARN] Setup probe failed — results may reflect auth misconfiguration, not real system load."
    );
  }
}
