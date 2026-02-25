# Session 4: Surgical Architect — Implementation Brief

> **For**: Cursor AI (implementer)
> **Reviewed by**: Antigravity (will audit your output)
> **Estimated effort**: ~3 hours
> **Branch**: `cortex-v2/session-4`
> **Depends on**: Sessions 2 AND 3 complete

---

## Codebase Context

- **MCP server**: `questerix-cortex/src/mcp-server/server.ts` (Session 2)
- **Verify engine**: `questerix-cortex/src/mcp-server/verify-engine.ts` (Session 3)
- **Fragility engine**: `questerix-cortex/src/mcp-server/fragility-engine.ts` (Session 3)
- **Change logger**: `questerix-cortex/src/mcp-server/change-logger.ts` (Session 3)
- **RiskScorer**: `questerix-cortex/src/risk-scorer/index.ts` — existing, use `calculateScore()`
- **normalizePath**: `questerix-cortex/src/utils/normalize-path.ts` (Session 1)
- **CortexDB**: `questerix-cortex/src/cortex-db/index.ts` (Session 1)

---

## Step 1: `cortex_plan` Tool — Universal Entry Point

Create tool handler for `cortex_plan` in the MCP server.

### Purpose

"I'm about to modify these files. What tier is this change, and what should I do?" This is the **pre-edit** tool. Agents call this BEFORE making changes.

### Input

```json
{ "files": ["features/auth/hooks/use-auth.ts", "App.tsx"] }
```

### Behavior: Tier Classification Decision Tree (FIXED)

```
1. Normalize all input paths
2. Count files
3. Check file extensions
4. Query fragility for all files
5. Check against STRUCTURAL_JSON_LIST
6. Classify tier:

   IF matches any pattern in STRUCTURAL_JSON_LIST → Tier C
   ELSE IF file_count > 10 → Tier C
   ELSE IF any file has fragility_index > 0.50 → Tier C
   ELSE IF file_count > 5 OR any file has fragility_index > 0.30 → Tier B
   ELSE → Tier A
```

### STRUCTURAL_JSON_LIST (FIXED — use glob matching):

```
tsconfig.json
package.json
vite.config.*
supabase/config.toml
.env*
supabase/migrations/**
admin-panel/src/App.tsx
admin-panel/src/main.tsx
admin-panel/src/types/database.types.ts
```

These are files where changes have outsized impact. Detection uses glob matching (e.g., `vite.config.*` matches `vite.config.ts`, `vite.config.mts`, etc.)

### Tier Protocol (FIXED):

| Tier  | Label        | Protocol                                                              |
| ----- | ------------ | --------------------------------------------------------------------- |
| **A** | Auto-approve | Low risk. Agent proceeds, runs `cortex_verify` after.                 |
| **B** | Auto-plan    | Medium risk. Agent should outline its changes, then proceed + verify. |
| **C** | Human gate   | High risk. Agent MUST get user approval before editing.               |

### RiskScorer Integration:

After tier classification, call `RiskScorer` for a risk assessment number:

```typescript
const riskScorer = new RiskScorer();
// Gather whatever results are available (may be partial)
const riskScore = riskScorer.calculateScore(availableResults);
```

**Note**: `cortex_plan` runs BEFORE changes, so test results aren't available. Pass what you have — fragility data, scope size. The `RiskScorer` handles `incomplete` dimensions gracefully (assigns weight 0).

### Return (FIXED structure):

```json
{
  "tier": "B",
  "label": "Auto-plan",
  "reason": "5 files, 1 with medium fragility",
  "protocol": "Outline your changes before proceeding. Run cortex_verify after.",
  "risk_assessment": {
    "composite": 65,
    "confidence": 30,
    "dimensions": { ... }
  },
  "fragility_warnings": [
    "features/auth/hooks/use-auth.ts: fragility 0.35, confidence MEDIUM"
  ],
  "structural_files": [],
  "suggested_tests": ["tests/LoginPage.spec.ts", "tests/auth-flow.e2e.spec.ts"]
}
```

### Compliance Logging (FIXED):

After returning the tier, write to `tool_calls`:

```typescript
db.prepare(
  `
  INSERT INTO tool_calls (timestamp, session_id, tool_name, parameters, result_tier)
  VALUES (?, ?, 'cortex_plan', ?, ?)
`,
).run(new Date().toISOString(), sessionId, JSON.stringify({ files }), tier);
```

---

## Step 2: `cortex_verify` Tool — Full Read + Write

Wire the verify engine (Session 3) into the MCP server as a callable tool.

### Purpose

"I just made changes. Did I break anything?" This is the **post-edit** tool. Agents call this AFTER making changes.

### Input

```json
{ "files": ["features/auth/hooks/use-auth.ts"] }
```

### Behavior (FIXED sequence):

1. **Normalize** input paths
2. **Call verify engine**: `runVerification(db, changedFiles, adminPath, sessionId)`
   - This runs `tsc --noEmit --incremental` (direct pass/fail, `cwd: adminPath`)
   - This finds + runs targeted tests
3. **Log changes**: For each changed file, call `logChange(db, filePath, sessionId, passed, failed, details)`
4. **Attribute fragility**: Call `attributeFragility(db, changedFiles, testResults, sessionId)`
5. **Log tool call**:
   ```typescript
   db.prepare(
     `
     INSERT INTO tool_calls (timestamp, session_id, tool_name, parameters, result_tier)
     VALUES (?, ?, 'cortex_verify', ?, ?)
   `,
   ).run(
     new Date().toISOString(),
     sessionId,
     JSON.stringify({ files }),
     tscPassed && testsPassed ? "PASS" : "FAIL",
   );
   ```
6. **Return** full results:
   ```json
   {
     "verdict": "PASS",
     "tsc": { "passed": true },
     "tests": {
       "unit": { "passed": 12, "failed": 0 },
       "e2e": { "passed": 3, "failed": 0 }
     },
     "fragility_updates": [
       { "file": "...", "new_index": 0.15, "confidence": "MEDIUM" }
     ],
     "duration_ms": 18500
   }
   ```

### Compliance Flow:

The `tool_calls` table now has entries for both `cortex_plan` (pre-edit) and `cortex_verify` (post-edit). Session 5 builds compliance reporting on top of this.

---

## Step 3: Compliance Checking Utility

Create `questerix-cortex/src/mcp-server/compliance.ts`:

### Function: `checkCompliance(db, sessionId)`

Queries `tool_calls` to check if the agent followed the protocol:

```typescript
const planCalls = db
  .prepare(
    "SELECT COUNT(*) as count FROM tool_calls WHERE session_id = ? AND tool_name = ?",
  )
  .get(sessionId, "cortex_plan");

const verifyCalls = db
  .prepare(
    "SELECT COUNT(*) as count FROM tool_calls WHERE session_id = ? AND tool_name = ?",
  )
  .get(sessionId, "cortex_verify");

return {
  plan_called: planCalls.count > 0,
  verify_called: verifyCalls.count > 0,
  compliant: planCalls.count > 0 && verifyCalls.count > 0,
  plan_count: planCalls.count,
  verify_count: verifyCalls.count,
};
```

This is used by Session 5's reporting integration.

---

## DO NOT List

- ❌ **Do NOT let `cortex_plan` run tests** — it's a pre-edit tool, tests are meaningless before changes
- ❌ **Do NOT skip compliance logging** — every tool call must write to `tool_calls`
- ❌ **Do NOT hardcode tier thresholds differently** from the decision tree above
- ❌ **Do NOT use string matching for STRUCTURAL_JSON_LIST** — use glob matching
- ❌ **Do NOT implement agent rules or GEMINI.md changes** — that's Session 5
- ❌ **Do NOT use `stdio: 'inherit'`** in any child process
- ❌ **Do NOT modify `admin-panel/` code**

---

## Acceptance Criteria (What the Reviewer Will Check)

1. [ ] `cortex_plan` correctly classifies Tier A/B/C based on the decision tree
2. [ ] STRUCTURAL_JSON_LIST uses glob matching (not exact string comparison)
3. [ ] Tier C triggered for: >10 files, fragility > 0.50, or structural files
4. [ ] Tier B triggered for: >5 files or fragility > 0.30
5. [ ] Tier A is the default for small, low-risk changes
6. [ ] `cortex_plan` returns tier, reason, protocol, fragility warnings, and suggested tests
7. [ ] `cortex_plan` integrates RiskScorer for risk_assessment
8. [ ] Both tools write to `tool_calls` table with session_id and timestamp
9. [ ] `cortex_verify` calls verify engine → change logger → fragility attribution in correct order
10. [ ] `cortex_verify` returns structured verdict with tsc + test results + fragility updates
11. [ ] `cortex_verify` measures and reports duration_ms
12. [ ] `checkCompliance()` queries `tool_calls` for plan + verify call counts
13. [ ] All tools return valid JSON in all states (graceful degradation)
14. [ ] `cortex_plan` does NOT run tests
15. [ ] `cortex_verify` does NOT classify tiers
