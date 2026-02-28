# Load & Spike Testing — Questerix Performance Suite

## Overview

This directory contains [k6](https://k6.io) load test scripts for validating the Questerix platform's performance under production-scale traffic before any major school onboarding event.

**Gate**: These tests must pass before declaring the platform ready for 50,000+ concurrent users.

---

## Directory Structure

```text
questerix-cortex/performance/
├── config.js                    # Shared SLA thresholds, env vars, header helpers
├── login_spike.js               # Scenario 1: 50k concurrent auth spike
├── quiz_submit_load.js          # Scenario 2: Sustained answer submission load
├── .env.k6.example              # Environment variable template (never commit .env.k6)
├── scripts/
│   └── seed_load_test_data.sql  # One-time seed: creates isolated load-test tenant
└── PERFORMANCE.md               # This file
```

---

## Prerequisites

### 1. Install k6

```bash
# Windows (winget)
winget install k6

# macOS
brew install k6

# Docker (no install required)
docker run --rm -i grafana/k6 run --vus 10 --duration 30s - <login_spike.js
```

### 2. Create the load test auth user

k6 **cannot** directly insert rows into `auth.users` on hosted Supabase. Create the user via the Supabase Admin API once:

```bash
# Using Supabase CLI
supabase auth user create \
  --email loadtest@questerix.com \
  --password "LoadTest!!1" \
  --project-id bkfhorslctqieetzqdtd
```

Or via the Supabase dashboard → **Authentication → Users → Invite user**.

### 3. Seed test data

Run the seed script against **staging** (never production):

```bash
psql $DATABASE_URL -f questerix-cortex/performance/scripts/seed_load_test_data.sql
```

The script prints the UUIDs on completion — copy them into `.env.k6`.

### 4. Create `.env.k6`

```bash
cp questerix-cortex/performance/.env.k6.example questerix-cortex/performance/.env.k6
# Edit .env.k6 and fill in SUPABASE_ANON_KEY
```

---

## Running the Tests

### Smoke test (local — 100 VUs, 1 minute)

```bash
# Login spike — smoke
k6 run \
  --vus 100 --duration 90s \
  --env-file performance/.env.k6 \
  questerix-cortex/performance/login_spike.js

# Quiz submit — smoke
k6 run \
  --vus 100 --duration 90s \
  --env-file performance/.env.k6 \
  questerix-cortex/performance/quiz_submit_load.js
```

### Full load test (50k VUs — run against staging only)

```bash
# Login spike — full scale
k6 run \
  --env-file performance/.env.k6 \
  questerix-cortex/performance/login_spike.js

# Quiz submit — full scale
k6 run \
  --env-file performance/.env.k6 \
  questerix-cortex/performance/quiz_submit_load.js
```

### Via Cortex (future integration)

```bash
# Not yet wired — placeholder for Cortex CLI integration
npm run health -- perf
```

---

## SLA Thresholds (Gate Conditions)

| Metric                 | Target    | Gate                |
| ---------------------- | --------- | ------------------- |
| **P95 response time**  | < 500ms   | ❌ FAIL if breached |
| **P99 response time**  | < 2,000ms | ❌ FAIL if breached |
| **Error rate**         | < 0.1%    | ❌ FAIL if breached |
| **Check pass rate**    | ≥ 99%     | ❌ FAIL if breached |
| Login success rate     | ≥ 99%     | ❌ FAIL             |
| Attempt submit success | ≥ 99%     | ❌ FAIL             |
| Profile read P95       | < 300ms   | ❌ FAIL             |

---

## Supavisor Connection Pool Findings

> Fill this section after running the first full-scale test.

| Parameter                 | Value         | Notes                                                    |
| ------------------------- | ------------- | -------------------------------------------------------- |
| **Default pool size**     | TBD           | Check `pg_stat_activity` under load                      |
| **Peak connections seen** | TBD           | Run `SELECT count(*) FROM pg_stat_activity;` during test |
| **Pool mode**             | `transaction` | Supavisor default — efficient for short queries          |
| **Max connections limit** | TBD           | Supabase Pro = 200 direct + pooler connections           |
| **Observed bottleneck**   | TBD           | To be documented after first run                         |
| **Recommended pool size** | TBD           | Based on P95 results                                     |

### How to measure Supavisor limits during a test

Open a psql session in a separate terminal while k6 is running:

```sql
-- Count active connections by state
SELECT state, count(*)
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY count DESC;

-- Check for connection wait events (pooler pressure)
SELECT wait_event_type, wait_event, count(*)
FROM pg_stat_activity
WHERE wait_event IS NOT NULL
GROUP BY 1, 2
ORDER BY 3 DESC;

-- Peak connection count (run every 5s during test)
SELECT count(*) AS total_connections
FROM pg_stat_activity;
```

---

## Architecture Notes

### Why `attempts` and not `outbox`?

The task spec referenced an `outbox` table for quiz answer submissions. **There is no `outbox` table in the Questerix schema.** The correct high-write path is `public.attempts` — this is where every student answer lands. Under 50k concurrent students, this table is the primary write bottleneck. The `sessions` table is also a target (lower write rate — one row per quiz session).

### Why k6 over Locust?

k6 was chosen over Locust for this implementation:

| Factor             | k6                              | Locust                |
| ------------------ | ------------------------------- | --------------------- |
| **Language**       | JavaScript (matches team stack) | Python                |
| **Startup**        | Single binary, zero deps        | Requires Python + pip |
| **CI integration** | Native GitHub Actions support   | More config required  |
| **Metrics**        | Built-in custom Trends/Rates    | Requires plugins      |
| **Supabase**       | Direct HTTP — no driver needed  | Same                  |

Locust is still a valid alternative if the team prefers Python. The same test scenarios can be implemented in `locustfile.py` with equivalent logic.

### Scaling considerations

At 50,000 concurrent VUs, a single k6 agent on a standard laptop will be CPU-bound. Options:

1. **k6 Cloud** — managed distributed execution, Grafana-integrated dashboards
2. **k6 Operator (Kubernetes)** — distribute across multiple pods
3. **GitHub Actions matrix** — run 10 agents × 5,000 VUs, aggregate results

For the initial baseline, a smoke test at 1,000 VUs is sufficient to validate the SLA model. Scale up gradually.

---

## Cleanup After Tests

The seed data is isolated in the `loadtest` subdomain. Clean up after a test run:

```sql
-- Remove all attempts created during load test
DELETE FROM public.attempts
WHERE question_id = 'a0000000-0000-4000-a000-000000000005';

-- Remove sessions
DELETE FROM public.sessions
WHERE skill_id = 'a0000000-0000-4000-a000-000000000004';
```

The tenant, domain, skill, and question rows can be left in place — they don't affect production data.
