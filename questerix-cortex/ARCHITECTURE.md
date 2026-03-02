# Questerix Cortex — Architecture (Final)

> **North Star**: A Session Handover System. Cortex captures the project's state, runs the health suite, and prepares the agent for a productive session.

## 1. Core Principles

- **Lean Agent**: Cortex handles the heavy lifting (scanning, running tests, audits) so the AI agent stays fast and focused.
- **Persistent Memory**: Tracks project health over time via historical snapshots.
- **Risk-Awareness**: Prioritizes failures based on their impact (e.g., Supabase mutations are P0).

## 2. Primary Outputs

1. **AGENT_CONTEXT.md**: (Max 20KB) A compressed briefing file for the agent. Contains: Surface map delta, failing hooks/pages, current P0 risks.
2. **NEXT_TASK.md**: Auto-generated task list for the user to review and paste. Priority: Failures (P0) → Coverage Gaps (P1) → Improvements (P2).
3. **HEALTH_REPORT.md**: Premium human dashboard with health scores and coverage heatmaps.

## 3. Modules

### 🔍 Scanner (Semantic)

- Uses `ts-morph` to map the admin-panel/src surface area.
- Tracks: Pages, Hooks, Services, and their linked test coverage.

### 🏃 Orchestrator (Runner)

- Runs Vitest, Playwright (Desktop/Mobile/Tablet), ESLint, CSpell, Axe-core, and RLS Audits.
- **UX**: Opens a **Live Browser Dashboard** at `http://localhost:5050` during the run.

### 🚢 Deployer (Auto-Release)

- **Tier 4 (Deploy)**: Executes production rollouts ONLY if all health tiers (Smoke, Deep, Release) are green.
- **Wrangler Integration**: Deploys the Admin Panel to Cloudflare Pages.
- **Supabase Integration**: Deploys Edge Functions via CLI.

### 📦 Shipper (Git Operations)

- **Tier 5 (Ship)**: Automates the Git push workflow ONLY if Deployment succeeds.
- **SCM Integration**: Auto-stages, commits with an intelligent summary, and pushes to remote with tags.
- **Verification**: Confirms that local HEAD matches remote before concluding.

### 🧠 Analyst (Intelligence)

- **Drift Detection**: Database types vs Live schema.
- **Dead Code**: Unused exports via graph DB query.
- **Migration Safety**: Integrity checks for new SQL moves.
- **Risk Scoring**: Composite health scoring via `RiskScorer`.

### � DeltaEngine (Active)

- **Surface Map Deltas**: Tracks changes between scans.
- **Hot Files Detection**: Identifies frequently modified code.

### 📊 GitOracle (Active)

- **Gap Analysis**: Correlates graph gaps with git history.
- **Change Attribution**: Links code changes to commit metadata.

### 🧟 ZombieHunter (Active)

- **Process Sterilization**: Pre-flight cleanup of orphaned processes.
- **Port Conflict Prevention**: Kills rogue Dart, Flutter, and Node processes.

### 🖥️ DashboardServer

- **Live Dashboard**: Express + socket.io server for real-time monitoring.
- **Static File Serving**: Serves dashboard React app at `localhost:5050`.
- **Bi-directional Events**: Emits logs/updates, listens for trigger events.

### � Historian (Trends)

- Keeps the last 30 runs in `HISTORY.json`.
- Calculates health trajectory with coverage metrics.

## 4. MCP Tools (10 total)

| Tool                | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `cortex_plan`       | Classify change tier (A/B/C) and suggest protocol |
| `cortex_impact`     | Dependency blast radius for file changes          |
| `cortex_verify`     | Run verification and update fragility after edits |
| `cortex_query`      | Symbol lookup with suffix matching                |
| `cortex_fragility`  | Check fragility index for files                   |
| `cortex_briefing`   | `AGENT_CONTEXT.md` with staleness warning         |
| `cortex_search`     | SQLite FTS5 symbol search                         |
| `cortex_diff`       | Structured diff since last session/24h/commit     |
| `cortex_insights`   | Graph intelligence: hotspots, orphans, cycles     |
| `cortex_governance` | Dead doc reference detection                      |

## 5. Configuration (`cortex.config.json`)

- Defines paths to `admin-panel`, `supabase`, and `test-results`.
- Sets thresholds for "Healthy" coverage and build size.

## 6. Usage

```powershell
npm run health
```

_(Runs the full suite and updates the three output files)_
