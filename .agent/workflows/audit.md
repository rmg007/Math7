---
description: Systematic architectural vulnerability audit
---

// turbo-all

# 🔍 /audit - Architectural Vulnerability Audit

> **⚡ Superpower Fallback**: If commands need approval, use `/sp` - I output JSON, you paste into `tasks.json`, watcher runs it.

**Purpose**: Proactively scan the entire codebase for known architectural vulnerability patterns and discover new ones.

**When to Use**: 
- Periodically (monthly recommended)
- After major features ship
- When external agents report findings
- Before security-critical releases

---

## 📊 Initialization

Create `.agent/artifacts/AUDIT_STATE.json`:

```json
{
  "audit_id": "audit_[date]",
  "started_at": "[timestamp]",
  "current_phase": 0,
  "vulnerability_guide": "knowledge/questerix_governance/artifacts/security/vulnerability_taxonomy.md",
  "findings": [],
  "status": "in_progress"
}
```

---

## 🎯 Phase 0: Ingest External Findings (Optional)

**Goal**: Capture findings from external sources before systematic scan.

If user provides findings from external agents (Gemini, DeepSource, etc.):

1. **Parse Each Finding**:
   - Extract description, severity, location
   - Assign next VUL-XXX ID from vulnerability taxonomy

2. **Check for Duplicates**:
   - Read `vulnerability_taxonomy.md`
   - If pattern already exists → Skip or update
   - If new pattern → Append using template

3. **Categorize by Tier**:
   - Tier 1 (Critical): Security & Privacy
   - Tier 2 (High): Logic & Governance
   - Tier 3 (Medium): Operations & Scale

4. **Update Vulnerability Taxonomy**:
   - Append new patterns with proper structure
   - Include: Status, Severity, Triggers, Prevention, Detection, Regression Test

**Exit Gate**: All external findings captured in taxonomy.

---

## 🛡️ Phase 1: Tier 1 Audit (Critical Security & Privacy)

**Goal**: Scan for VUL-001 through VUL-003 and similar critical patterns.

### VUL-001: Orphaned Student Identity Crisis
```powershell
# Check for guest login without recovery mechanism
grep -r "signInAnonymously\|GuestAuth\|anonymous" student-app/lib/
```
- **Pass if**: Recovery key or account linking is enforced
- **Fail if**: Anonymous auth exists without persistence anchor

### VUL-002: Subject Leakage
```powershell
# Check RLS policies for mentor access
grep -A 20 "POLICY.*mentor" supabase/migrations/*.sql | grep -v "domain_id"

# Check admin queries for missing domain filters
grep -r "\.from('skill_progress')" admin-panel/src | grep -v "domain_id"
```
- **Pass if**: All mentor policies filter by domain_id
- **Fail if**: Domain filter missing in any mentor-facing query

### VUL-003: SQLite Integrity Loophole
```powershell
# Check if sync accepts raw is_correct
grep -r "is_correct" student-app/lib/services/sync* supabase/functions/
```
- **Pass if**: Server recalculates correctness
- **Fail if**: Client-submitted is_correct trusted

**Exit Gate**: All Tier 1 patterns checked. Document findings.

---

## 🧠 Phase 2: Tier 2 Audit (Logic & Governance)

**Goal**: Scan for VUL-004 through VUL-007.

### VUL-004: Zombie Curriculum
```powershell
# Check for hard deletes on curriculum tables
grep -r "DELETE FROM.*questions\|skills\|domains" supabase/migrations/*.sql admin-panel/src
```
- **Pass if**: Soft deletes (deleted_at) used exclusively
- **Fail if**: Hard deletes without referential check

### VUL-005: Version Skew
```powershell
# Check if attempts include version tracking
grep -r "version_id\|content_version" student-app/lib/services/sync*
```
- **Pass if**: Version ID tracked in attempts
- **Fail if**: No version tracking for offline answers

### VUL-006: Settings Conflict
```powershell
# Check for settings resolution logic
grep -r "SettingsResolver\|restrictive.*wins\|priority.*settings" student-app/lib questerix_domain/lib
```
- **Pass if**: Conflict resolution logic exists
- **Fail if**: No multi-group settings handling

### VUL-007: Join Code Brute-Force
```powershell
# Check join code length and rate limiting
grep -r "join_code\|JoinCode" supabase/functions/ supabase/migrations/
```
- **Pass if**: Rate limiting + 8+ char codes
- **Fail if**: 6-char codes without exponential backoff

**Exit Gate**: All Tier 2 patterns checked. Document findings.

---

## 🏗️ Phase 3: Tier 3 Audit (Operations & Scale)

**Goal**: Scan for VUL-008 through VUL-011.

### VUL-008: Sync Loop Performance
```powershell
# Check for batch processing in sync
grep -r "batch\|bulk\|chunk" student-app/lib/services/sync*
```
- **Pass if**: Batch processing implemented
- **Fail if**: Sequential single-record RPCs

### VUL-009: Storage Quota
```powershell
# Check for quota management
grep -r "quota\|storage.*limit\|IndexedDB" student-app/lib
```
- **Pass if**: Quota monitoring + LRU eviction
- **Fail if**: No storage management

### VUL-010: Ghost Student Compliance
```powershell
# Check for cleanup on membership deletion
grep -r "ON DELETE\|anonymize\|GDPR\|right.*forgotten" supabase/migrations/*.sql
```
- **Pass if**: Cleanup triggers exist
- **Fail if**: Orphaned data persists

### VUL-011: Recursive RLS Performance
```powershell
# Check for materialized views or JWT claims
grep -r "MATERIALIZED VIEW\|app.claim\|jwt.*claim" supabase/migrations/*.sql
```
- **Pass if**: Performance optimization in place
- **Fail if**: Deep recursive checks in RLS

**Exit Gate**: All Tier 3 patterns checked. Document findings.

---

## 🧠 Phase 3.5: IDD Protocol Compliance Audit

**Goal**: Verify all code follows the Integrity-Driven Development protocol.

### Test Path Coverage Check
```powershell
# Search for test files and verify 4 paths exist
find . -name "*test.*" -type f | xargs grep -l "Happy\|Destructive\|Boundary\|Idempotent"
```
- **Pass if**: All new features have ✅💥⏱️🔄 test coverage
- **Fail if**: Missing any of the 4 required test paths

### Silent Failure Detection
```powershell
# Empty catch blocks
grep -r "catch.*{[\s]*}" --include="*.ts" --include="*.dart" --include="*.py"

# Null returns where error is appropriate
grep -r "return null;.*error\|return null;.*fail" --include="*.ts" --include="*.dart"
```
- **Pass if**: All catch blocks have log + rethrow OR typed error
- **Fail if**: Silent failures found (empty catch, ambiguous null)

### Threat Model Verification
- Check implementation plans for explicit 5-vector threat models
- **Pass if**: All features document the 5 categories explicitly
- **Fail if**: Generic threats or missing categories

**Exit Gate**: IDD compliance verified. Document violations.

---

## 🔬 Phase 4: Exploratory Analysis (Unknown Unknowns)

**Goal**: Hunt for NEW vulnerability patterns not yet documented.

### Trust Boundary Analysis
- Identify all places where client data enters evaluative logic
- Look for unvalidated user input in critical paths

### Permission Escalation Check
- Test API endpoints with incorrect roles
- Look for missing role guards

### Data Leakage Scan
```powershell
# Find all Supabase queries missing app_id filter
grep -r "\.from\|\.select" admin-panel/src student-app/lib | grep -v "app_id"
```

### Module Coupling Analysis
```powershell
# Run dependency-cruiser validation
npm run deps:validate

# Generate visual report for inspection
npm run deps:report
```
- **Check for**: Circular dependencies, orphan modules, cross-feature imports
- **Review**: Open `dependency-report.html` for interactive graph
- **Pass if**: "no dependency violations found"
- **Fail if**: Any circular dependencies or architecture rule violations

### New Pattern Discovery
- If suspicious code found → Document as potential vulnerability
- Add to findings with "NEEDS REVIEW" status

**Exit Gate**: Exploratory analysis complete. New patterns documented.

---

## 📋 Phase 5: Generate Audit Report

**Goal**: Produce actionable report with all findings.

Create `.agent/artifacts/AUDIT_REPORT_[date].md`:

```markdown
# Architectural Security Audit Report
**Date**: [timestamp]
**Auditor**: AI Agent
**Scope**: Full codebase

## Executive Summary
| Tier | Pass | Fail | Total |
|------|------|------|-------|
| Critical | X | Y | Z |
| High | X | Y | Z |
| Medium | X | Y | Z |

## Detailed Findings

### 🔴 CRITICAL: [VUL-ID] - [Name]
- **Location**: `file:line`
- **Evidence**: [grep output or code snippet]
- **Fix Required**: [specific action]

### ✅ PASS: [VUL-ID] - [Name]
- **Verification**: [what was checked]
- **Evidence**: [command output]

## New Patterns Discovered
[List any new vulnerability patterns found during exploratory phase]

## Security Posture Score
[Update metrics from vulnerability_taxonomy.md]

## Recommendations
1. [Prioritized action items]
```

**Exit Gate**: Report generated and saved.

---

## 🚀 Phase 6: Remediation Flow

**Goal**: Fix findings or create tracking issues.

### Present Findings to User (via notify_user)

```markdown
## 🔍 Audit Complete

**Summary**: Found X Critical, Y High, Z Medium issues.

[Attach AUDIT_REPORT link]

## Remediation Options

1. **Fix Now**: Start `/process` workflow for each critical finding
2. **Create Issues**: Generate GitHub issues for deferred fixes
3. **Review First**: User reviews findings before action

Which option should I proceed with?
```

### If "Fix Now" Selected

For each finding (Critical first):
1. Create task in `/process` format
2. Plan fix in Phase 1
3. Implement in Phase 3
4. Verify in Phase 4
5. Update vulnerability taxonomy status to RESOLVED

After all fixes:
- Run `/certify` to independently verify
- Update security posture metrics

### If "Create Issues" Selected

For each finding:
1. Create GitHub issue with:
   - Title: `[VUL-XXX] Pattern Name`
   - Body: Detection evidence + fix guidance
   - Labels: `security`, `tier-X`
2. Link issues in AUDIT_REPORT

**Exit Gate**: Remediation path executed or issues created.

---

## ✅ Audit Completion

1. **Update Vulnerability Taxonomy**:
   - Mark resolved patterns as ✅ RESOLVED
   - Add new patterns discovered
   - Update security posture metrics

2. **Archive Report**:
   - Save to `.agent/artifacts/audits/`
   - Link from AUDIT_STATE.json

3. **Announce**:
   - "Audit complete. X issues found, Y fixed, Z documented."

---

## 📊 Audit Cadence

| Trigger | Scope |
|---------|-------|
| Monthly | Full codebase |
| Post-feature | Affected sectors only |
| External report | Ingest + targeted scan |
| Pre-release | Full + exploratory |
