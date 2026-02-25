# Session 5: Integration + Compliance Wiring — Implementation Brief

> **For**: Cursor AI (implementer)
> **Reviewed by**: Antigravity (will audit your output)
> **Estimated effort**: ~1.5 hours
> **Branch**: `cortex-v2/session-5`
> **Depends on**: Session 4 complete (all 5 tools working)

---

## Codebase Context

- **Agent rules**: `GEMINI.md` (root) — main AI agent instructions
- **Agent rules**: `AGENTS.md` (if it exists) — secondary instructions
- **Reporter**: `questerix-cortex/src/reporter/index.ts` — existing, generates health reports
- **Compliance utility**: `questerix-cortex/src/mcp-server/compliance.ts` (Session 4)
- **MCP server**: `questerix-cortex/src/mcp-server/server.ts` (Sessions 2-4)
- **cortex.db**: `questerix-cortex/outputs/cortex.db`

---

## Step 1: Wire Into Agent Rules — GEMINI.md

Add a new section to `GEMINI.md` (the root-level agent instructions file):

### New section to add:

```markdown
## Cortex v2 — Required Protocol

### Pre-Edit: Always call `cortex_plan`

Before modifying any source file in `admin-panel/src/`, call the `cortex_plan` MCP tool:
```

cortex_plan({ files: ["features/auth/hooks/use-auth.ts", ...] })

```

This returns a tier classification (A/B/C) and protocol:
- **Tier A** (auto-approve): Proceed, then verify
- **Tier B** (auto-plan): Outline your changes, then proceed and verify
- **Tier C** (human gate): Get user approval before editing

### Post-Edit: Always call `cortex_verify`
After completing edits, call `cortex_verify`:
```

cortex_verify({ files: ["features/auth/hooks/use-auth.ts", ...] })

```

This runs targeted tsc + tests and updates fragility data.

### Compliance
Both calls are logged to `cortex.db`. Skipping either is flagged in the health report.
```

### IMPORTANT RULES:

- Do NOT delete any existing content in GEMINI.md — only ADD the new section
- Place it after the "Coding Standards" section but before "Key Files"
- Keep it concise — agents have limited context windows

---

## Step 2: Update Key Files Table in GEMINI.md

Add entries to the existing "Key Files" table:

```markdown
| Cortex v2 DB | `questerix-cortex/outputs/cortex.db` |
| MCP Server | `questerix-cortex/src/mcp-server/server.ts` |
| Session briefs | `questerix-cortex/briefs/` |
```

---

## Step 3: Compliance Reporting in Reporter

Modify `questerix-cortex/src/reporter/index.ts` to include a Cortex v2 compliance section in health reports.

### What to add:

After the existing report generation, add a section that:

1. Opens `cortex.db` (read-only — just querying, not writing)
2. Gets the most recent session_id from `tool_calls`
3. Runs the compliance check (from Session 4's `checkCompliance()`)
4. Queries `change_log` for that session's changes
5. Queries `fragility` for the top 5 most fragile files

### Report section format:

```markdown
## 🧠 Cortex v2 Intelligence

### Protocol Compliance (Session: abc-123-def)

- `cortex_plan` called: ✅ 3 times
- `cortex_verify` called: ✅ 2 times
- Compliance: ✅ COMPLIANT

### Top 5 Fragile Files

| File                                       | Fragility Index | Confidence | Last Failure |
| ------------------------------------------ | --------------- | ---------- | ------------ |
| features/auth/hooks/use-auth.ts            | 0.42            | HIGH       | 2026-02-20   |
| features/curriculum/hooks/use-questions.ts | 0.35            | MEDIUM     | 2026-02-18   |

### Graph Statistics

- Nodes: 184
- Edges: 523
- Last scan: 2026-02-25T12:00:00Z (commit: abc1234)
```

### Error handling:

- If `cortex.db` doesn't exist → skip this section entirely (print `Cortex v2 not initialized`)
- If tables are empty → print "No data yet"
- Never crash the reporter due to Cortex v2 — this is additive

---

## Step 4: Graceful Degradation Audit

Go through ALL 5 tools and verify each handles these scenarios:

| Scenario                               | Expected Behavior                                                |
| -------------------------------------- | ---------------------------------------------------------------- |
| **cortex.db doesn't exist**            | Return `{ warning: "Run 'npm run health' first", data: null }`   |
| **Empty graph (0 nodes)**              | Return `{ warning: "Graph empty", data: null }`                  |
| **File not in graph**                  | Return data with warning, not an error                           |
| **DB locked (busy)**                   | `busy_timeout = 5000` handles this — verify it's set             |
| **DB corrupted**                       | Catch error, delete file, return warning                         |
| **git not available**                  | Delta scan skips, returns stale graph with warning               |
| **tsc not installed**                  | `cortex_verify` catches error, reports "tsc unavailable"         |
| **No tests match**                     | `cortex_verify` reports "no targeted tests found", only runs tsc |
| **Agent passes absolute Windows path** | `normalizePath()` handles it                                     |
| **Agent passes `@/` prefixed path**    | `normalizePath()` handles it                                     |

For each: verify or add a try/catch + fallback response.

---

## Step 5: Document Scope Boundaries

Add to `GEMINI.md` or a separate `questerix-cortex/SCOPE.md`:

```markdown
## Cortex v2 Scope Boundaries

### Graph Coverage

- **Covered**: `admin-panel/src/` (~184 files)
- **Not covered**: `questerix-cortex/`, `supabase/`, `scripts/`, `docs/`
- **Not covered**: External dependencies (react, @supabase/supabase-js, etc.)

### E2E Test Coverage

- **Convention-mapped**: ~26-32 of 64 E2E test files
- **Not mapped**: Cross-feature tests, regression tests, infrastructure tests
- **Fallback**: Full suite for Tier C changes

### Limitations

- New E2E test files require a full `npm run health` scan to be mapped
- Incremental delta scan only covers `admin-panel/src/` — test directory changes aren't detected
- Graph is file-level, not line-level — moving a function within a file isn't tracked
```

---

## DO NOT List

- ❌ **Do NOT delete existing GEMINI.md content** — only add new sections
- ❌ **Do NOT make the Reporter crash if cortex.db is missing** — graceful degradation
- ❌ **Do NOT add new npm dependencies** — everything is already available
- ❌ **Do NOT modify the 5 tools' core logic** — only add error handling if missing
- ❌ **Do NOT modify `admin-panel/` code**

---

## Acceptance Criteria (What the Reviewer Will Check)

1. [ ] GEMINI.md has Cortex v2 protocol section (cortex_plan + cortex_verify instructions)
2. [ ] GEMINI.md key files table includes cortex.db, MCP server, and briefs
3. [ ] Reporter includes Cortex v2 compliance section in health reports
4. [ ] Reporter queries `tool_calls`, `change_log`, and `fragility` tables
5. [ ] Reporter shows top 5 fragile files with fragility_index and confidence
6. [ ] Reporter shows graph statistics (node count, edge count, last scan)
7. [ ] Reporter gracefully handles missing `cortex.db` (no crash)
8. [ ] All 5 tools handle all 10 degradation scenarios from the table
9. [ ] Scope boundaries documented (what's covered, what's not)
10. [ ] No existing GEMINI.md content was deleted or modified
11. [ ] No admin-panel source files were modified
12. [ ] `npm run health` still completes successfully
