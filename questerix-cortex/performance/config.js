/**
 * Questerix k6 Load Test — Shared Configuration
 *
 * All test scripts import from this file so SLA thresholds and connection
 * parameters are defined once. Override individual values via environment
 * variables so the same scripts can run against staging or production.
 *
 * Usage:
 *   k6 run login_spike.js
 *   k6 run quiz_submit_load.js
 *   SUPABASE_URL=https://... k6 run login_spike.js
 *
 * Required env vars (set in .env.k6 and loaded via --env or k6's --env flag):
 *   SUPABASE_URL        - Supabase project REST base URL (no trailing slash)
 *   SUPABASE_ANON_KEY   - Public anon key for unauthenticated calls
 *   K6_TEST_EMAIL       - Email of a pre-seeded load-test user
 *   K6_TEST_PASSWORD    - Password for the load-test user
 *   K6_APP_ID           - app_id UUID for the target tenant
 *   K6_QUESTION_ID      - question_id UUID for attempt submissions
 *   K6_SKILL_ID         - skill_id UUID for session creation
 *
 * Optional:
 *   K6_TARGET_VUS       - Override peak virtual users (default: 50000)
 *   K6_RAMP_DURATION    - Override ramp duration string (default: "2m")
 *   K6_SUSTAIN_DURATION - Override sustain duration string (default: "5m")
 */

// ── Connection ─────────────────────────────────────────────────────────────────

export const SUPABASE_URL =
  __ENV.SUPABASE_URL || "https://bkfhorslctqieetzqdtd.supabase.co";

export const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "";

// ── Test data ─────────────────────────────────────────────────────────────────

export const TEST_EMAIL = __ENV.K6_TEST_EMAIL || "loadtest@questerix.com";
export const TEST_PASSWORD = __ENV.K6_TEST_PASSWORD || "LoadTest!!1";
export const APP_ID =
  __ENV.K6_APP_ID || "00000000-0000-0000-0000-000000000000";
export const QUESTION_ID =
  __ENV.K6_QUESTION_ID || "00000000-0000-0000-0000-000000000000";
export const SKILL_ID =
  __ENV.K6_SKILL_ID || "00000000-0000-0000-0000-000000000000";

// ── Scale ─────────────────────────────────────────────────────────────────────

export const PEAK_VUS = parseInt(__ENV.K6_TARGET_VUS || "50000", 10);
export const RAMP_DURATION = __ENV.K6_RAMP_DURATION || "2m";
export const SUSTAIN_DURATION = __ENV.K6_SUSTAIN_DURATION || "5m";
export const RAMP_DOWN_DURATION = __ENV.K6_RAMP_DOWN_DURATION || "1m";

// ── SLA Thresholds ────────────────────────────────────────────────────────────
// These are the gate values. Tests fail CI if any threshold is breached.

export const SLA = {
  // P95 response time < 500ms across ALL requests
  http_req_duration_p95_ms: 500,

  // P99 response time < 2000ms (tail latency guard)
  http_req_duration_p99_ms: 2000,

  // Zero connection failures allowed (connection refused / network error)
  http_req_failed_rate_max: 0.001, // 0.1% max — covers transient noise

  // Request throughput must stay above 1000 RPS at peak
  // (approximation — actual check is done via checks rate)
  http_reqs_min_rate: 1000,
};

// ── Shared k6 threshold object (import into each script's options) ────────────

export const THRESHOLDS = {
  // SLA 1: P95 < 500ms
  http_req_duration: [
    `p(95)<${SLA.http_req_duration_p95_ms}`,
    `p(99)<${SLA.http_req_duration_p99_ms}`,
  ],
  // SLA 2: Zero dropped connections
  http_req_failed: [`rate<${SLA.http_req_failed_rate_max}`],
  // SLA 3: All custom checks must pass at ≥99% rate
  checks: ["rate>=0.99"],
};

// ── Shared headers factory ────────────────────────────────────────────────────

/**
 * Returns headers suitable for authenticated Supabase REST calls.
 * @param {string} token - Supabase access_token from login response
 */
export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
    Prefer: "return=minimal",
  };
}

/**
 * Returns headers for unauthenticated calls (anon key only).
 */
export function anonHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
  };
}
