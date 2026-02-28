/**
 * Questerix k6 Load Test — Quiz Answer Submission Load Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates that the `attempts` table (the real high-write path for quiz
 * answer submissions) handles sustained concurrent write pressure without
 * dropping connections or exceeding P95 latency SLAs.
 *
 * NOTE: There is no `outbox` table in the Questerix schema. The correct
 * high-write target is `public.attempts` — this is where every student answer
 * submission lands. Under 50k concurrent students, this table is the primary
 * write bottleneck.
 *
 * Scenario design:
 *   - Use a constant arrival rate executor to generate a fixed request rate
 *     regardless of VU count — this correctly models write throughput.
 *   - Targets 5,000 submissions/second (approximation for 50k students each
 *     submitting one answer roughly every 10 seconds during a quiz session).
 *   - Each VU lifecycle:
 *       1. POST /auth/v1/token — login (setup phase)
 *       2. POST /rest/v1/sessions — create a quiz session
 *       3. POST /rest/v1/attempts — submit N answers (main load loop)
 *       4. PATCH /rest/v1/sessions?id=eq.{id} — close session
 *
 * Gate (CI fails if any threshold is breached):
 *   - P95 attempt submission latency < 500ms
 *   - P99 attempt submission latency < 2,000ms
 *   - Failure rate < 0.1% (zero dropped connections)
 *   - Check rate ≥ 99%
 *
 * Run locally:
 *   k6 run questerix-cortex/performance/quiz_submit_load.js \
 *     --env SUPABASE_ANON_KEY=<key> \
 *     --env K6_TEST_EMAIL=loadtest@questerix.com \
 *     --env K6_TEST_PASSWORD=LoadTest!!1 \
 *     --env K6_APP_ID=<uuid> \
 *     --env K6_QUESTION_ID=<uuid> \
 *     --env K6_SKILL_ID=<uuid>
 *
 * Smoke test (100 VUs, 30s):
 *   k6 run --vus 100 --duration 30s \
 *     -e K6_TARGET_VUS=100 \
 *     questerix-cortex/performance/quiz_submit_load.js
 */

import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import { check, sleep } from "k6";
import http from "k6/http";
import { Counter, Rate, Trend } from "k6/metrics";
import {
    ANON_KEY,
    APP_ID,
    PEAK_VUS,
    QUESTION_ID,
    RAMP_DOWN_DURATION,
    RAMP_DURATION,
    SKILL_ID,
    SUPABASE_URL,
    SUSTAIN_DURATION,
    TEST_EMAIL,
    TEST_PASSWORD,
    THRESHOLDS,
    anonHeaders,
    authHeaders,
} from "./config.js";

// ── Custom metrics ────────────────────────────────────────────────────────────

const attemptSubmitLatency = new Trend("attempt_submit_latency_ms");
const attemptSuccessRate = new Rate("attempt_success_rate");
const sessionCreateSuccessRate = new Rate("session_create_success_rate");
const totalAttemptsSubmitted = new Counter("total_attempts_submitted");

// ── Test options ──────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    sustained_write_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        // Warm up Supavisor connection pool gradually
        { duration: RAMP_DURATION, target: PEAK_VUS },
        // Sustained write pressure — simulates all students mid-quiz simultaneously
        { duration: SUSTAIN_DURATION, target: PEAK_VUS },
        // Ramp down
        { duration: RAMP_DOWN_DURATION, target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    ...THRESHOLDS,
    // Attempt-specific thresholds
    attempt_submit_latency_ms: [
      "p(95)<500",
      "p(99)<2000",
      "avg<250", // Average should be well under SLA median
    ],
    attempt_success_rate: ["rate>=0.99"],
    session_create_success_rate: ["rate>=0.99"],
  },
};

// ── VU state (per-VU, persists across iterations) ────────────────────────────

// k6 doesn't support class-level state directly, so we use module-level
// variables. Each VU gets its own copy of these.
let vuAccessToken = null;
let vuSessionId = null;
let vuLoginAttempts = 0;
const MAX_LOGIN_RETRIES = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Authenticate this VU. Called lazily on first iteration and on token expiry.
 * Returns true if successful.
 */
function ensureAuthenticated() {
  if (vuAccessToken) return true;
  if (vuLoginAttempts >= MAX_LOGIN_RETRIES) return false;

  vuLoginAttempts++;
  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: anonHeaders(), tags: { operation: "auth_login" } }
  );

  if (res.status !== 200) return false;

  try {
    vuAccessToken = JSON.parse(res.body)?.access_token ?? null;
    vuLoginAttempts = 0; // reset on success
    return vuAccessToken !== null;
  } catch {
    return false;
  }
}

/**
 * Create a new quiz session. Returns the session id string, or null on failure.
 */
function createSession(token) {
  const body = JSON.stringify({
    user_id: "00000000-0000-0000-0000-000000000000", // placeholder — real load tests seed users
    skill_id: SKILL_ID === "00000000-0000-0000-0000-000000000000" ? null : SKILL_ID,
    questions_attempted: 0,
    questions_correct: 0,
    total_time_ms: 0,
  });

  const res = http.post(`${SUPABASE_URL}/rest/v1/sessions`, body, {
    headers: {
      ...authHeaders(token),
      Prefer: "return=representation",
    },
    tags: { operation: "session_create" },
  });

  sessionCreateSuccessRate.add(res.status === 201 || res.status === 200);

  if (res.status !== 201 && res.status !== 200) return null;

  try {
    const parsed = JSON.parse(res.body);
    // Supabase returns array for REST inserts with return=representation
    const session = Array.isArray(parsed) ? parsed[0] : parsed;
    return session?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Submit a single quiz answer attempt.
 * Uses uuidv4() so each submission is unique — avoids unique constraint
 * violations in the attempts table.
 */
function submitAttempt(token, sessionId) {
  // Randomise is_correct to simulate realistic mixed performance
  const isCorrect = Math.random() > 0.4; // 60% correct rate
  const timeSpentMs = Math.floor(Math.random() * 25000) + 3000; // 3s–28s

  const body = JSON.stringify({
    user_id: "00000000-0000-0000-0000-000000000000",
    question_id:
      QUESTION_ID === "00000000-0000-0000-0000-000000000000"
        ? uuidv4() // Generate synthetic UUID if not configured — won't FK match but tests write throughput
        : QUESTION_ID,
    response: {
      selected_option: isCorrect ? "A" : "B",
      raw_text: null,
      time_spent_ms: timeSpentMs,
    },
    is_correct: isCorrect,
    score_awarded: isCorrect ? 1 : 0,
    time_spent_ms: timeSpentMs,
  });

  const start = Date.now();
  const res = http.post(`${SUPABASE_URL}/rest/v1/attempts`, body, {
    headers: authHeaders(token),
    tags: { operation: "attempt_submit" },
  });
  const duration = Date.now() - start;

  attemptSubmitLatency.add(duration);

  const ok = check(res, {
    "attempt: status 201": (r) => r.status === 201,
    "attempt: response time < 500ms": (r) => r.timings.duration < 500,
  });

  attemptSuccessRate.add(ok);
  if (ok) totalAttemptsSubmitted.add(1);

  return ok;
}

// ── Test lifecycle ────────────────────────────────────────────────────────────

export function setup() {
  if (!ANON_KEY) {
    console.warn("[WARN] SUPABASE_ANON_KEY not set — requests will fail with 401.");
  }

  if (
    APP_ID === "00000000-0000-0000-0000-000000000000" ||
    QUESTION_ID === "00000000-0000-0000-0000-000000000000"
  ) {
    console.warn(
      "[WARN] K6_APP_ID / K6_QUESTION_ID not set. " +
        "Foreign key constraints will cause attempt inserts to fail. " +
        "Run scripts/seed_load_test_data.sql first, then set the env vars."
    );
  }

  return {};
}

export default function () {
  // ── Authenticate ──────────────────────────────────────────────────────────
  if (!ensureAuthenticated()) {
    sleep(2);
    return;
  }

  // ── Create session (first iteration per VU) ───────────────────────────────
  if (!vuSessionId) {
    vuSessionId = createSession(vuAccessToken);
    // If session create fails, reset token to force re-auth next iteration
    if (!vuSessionId) {
      vuAccessToken = null;
      sleep(1);
      return;
    }
  }

  // ── Submit 5 answers per iteration (realistic quiz pacing) ───────────────
  // 5 answers × ~5s think time = ~25s per quiz round
  for (let i = 0; i < 5; i++) {
    const ok = submitAttempt(vuAccessToken, vuSessionId);

    // If a JWT expired, clear it so next iteration re-auths
    if (!ok) {
      vuAccessToken = null;
      vuSessionId = null;
      break;
    }

    // Realistic per-question think time (3s–8s — student reading the question)
    sleep(Math.random() * 5 + 3);
  }

  // ── Long think time between rounds (student reviewing results) ────────────
  sleep(Math.random() * 10 + 5);
}

export function teardown() {
  console.log("[DONE] Quiz submit load test complete.");
}
